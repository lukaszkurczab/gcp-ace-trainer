"""Read a private copy of the existing iPhone 17 HTTP storage, never live SQLite.

This is deliberately limited to the observed CFNetwork alt-services schema.
Unknown schemas/values fail closed; hashes do not prove absence of historical
payloads in unused pages or prove that the SDK made no network request.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import sqlite3
import struct
import tempfile
import uuid


DEVICE = "7F315654-3175-4F3C-BB24-B0263F59360C"
FILES = ("httpstorages.sqlite", "httpstorages.sqlite-wal", "httpstorages.sqlite-shm")
COLUMNS = ("partition", "host", "alternateHost", "port", "alternatePort", "type", "creation_time", "expires_time")
TABLE_INFO = [(i, name, "TEXT" if i < 3 else "INT", int(i < 6), None, 0) for i, name in enumerate(COLUMNS)]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_copy_database(copied):
    # Only the private copy is opened. SQLite may update its SHM locks.
    with sqlite3.connect((copied / FILES[0]).as_uri() + "?mode=ro", uri=True) as db:
        if db.execute("pragma quick_check").fetchall() != [("ok",)]:
            raise ValueError("copy_integrity_rejected")
        objects = db.execute("select type,name from sqlite_master order by type,name").fetchall()
        if objects != [("index", "sqlite_autoindex_alt_services_1"), ("table", "alt_services")]:
            raise ValueError("schema_rejected")
        if db.execute("pragma table_info(alt_services)").fetchall() != TABLE_INFO:
            raise ValueError("schema_rejected")
        if db.execute("pragma index_list(alt_services)").fetchall() != [(0, "sqlite_autoindex_alt_services_1", 1, "u", 0)]:
            raise ValueError("schema_rejected")
        if db.execute("pragma index_info(sqlite_autoindex_alt_services_1)").fetchall() != [(0, 0, "partition"), (1, 1, "host"), (2, 3, "port"), (3, 5, "type")]:
            raise ValueError("schema_rejected")
        sql = db.execute("select sql from sqlite_master where name='alt_services'").fetchone()[0]
        expected_sql = "CREATE TABLE alt_services ( partition text NOT NULL, host text NOT NULL, alternateHost text NOT NULL, port int NOT NULL, alternatePort int NOT NULL, type int NOT NULL, creation_time int, expires_time int, UNIQUE(partition, host, port, type) )"
        if " ".join(sql.split()) != expected_sql:
            raise ValueError("schema_rejected")
        rows = db.execute("select * from alt_services order by partition,host,port,type").fetchall()
        for row in rows:
            if row[:3] != ("", "clients3.google.com", "clients3.google.com") or row[3:6] != (443, 443, 1) or any(type(v) is not int for v in row[3:]):
                raise ValueError("unclassified_record")
        return rows


def compare(before_receipt, after_receipt):
    receipts = []
    for value in (before_receipt, after_receipt):
        path = Path(value)
        if path != path.resolve() or not str(path).startswith("/private/tmp/"):
            raise ValueError("path_rejected")
        receipts.append(json.loads(path.read_text()))
    before, after = receipts
    copies = [Path(receipt["copy"]) for receipt in receipts]
    for receipt, copied in zip(receipts, copies):
        if not receipt["stableCopy"] or copied != copied.resolve() or not str(copied).startswith("/private/tmp/"):
            raise ValueError("copy_integrity_rejected")
        # SQLite reads can change locks in the private copied SHM. Its receipt
        # retains the hash at capture; compare revalidates DB/WAL payloads only.
        if any(digest(copied / name) != receipt["sourceSha256"][name] for name in FILES[:2]):
            raise ValueError("copy_integrity_rejected")
    logical_rows = [read_copy_database(copied) for copied in copies]
    for receipt, rows in zip(receipts, logical_rows):
        if receipt["logicalSha256"] != hashlib.sha256(json.dumps(rows, separators=(",", ":")).encode()).hexdigest():
            raise ValueError("copy_integrity_rejected")
    old, new = [(copied / FILES[1]).read_bytes() for copied in copies]
    page_size = before["wal"]["pageSize"]
    stride = page_size + 24
    if page_size != after["wal"]["pageSize"] or not new.startswith(old) or (len(new) - len(old)) % stride:
        raise ValueError("wal_comparison_unclassified")
    main = (copies[0] / FILES[0]).read_bytes()
    pages = {i // page_size + 1: main[i:i + page_size] for i in range(0, len(main), page_size)}
    for offset in range(32, len(old), stride):
        page = struct.unpack(">I", old[offset:offset + 4])[0]
        pages[page] = old[offset + 24:offset + stride]
    changes = []
    for offset in range(len(old), len(new), stride):
        page, database_size = struct.unpack(">II", new[offset:offset + 8])
        payload = new[offset + 24:offset + stride]
        if page not in pages or new[offset + 8:offset + 16] != new[16:24]:
            raise ValueError("wal_comparison_unclassified")
        changed = [i for i in range(page_size) if payload[i] != pages[page][i]]
        allowed = set(range(24, 28)) | set(range(92, 96))
        if page != 1 or not set(changed).issubset(allowed):
            raise ValueError("wal_comparison_unclassified")
        changes.append({"page": page, "commitDatabasePages": database_size, "changedPayloadOffsets": changed})
        pages[page] = payload
    return {"schema": "patternly.http-storage-comparison.v1",
            "logicalEqual": before["logicalSha256"] == after["logicalSha256"],
            "existingWalBytesUnchanged": True,
            "changedFiles": [name for name in FILES if before["sourceSha256"][name] != after["sourceSha256"][name]],
            "appendedFrames": changes, "classification": "sqlite_header_change_counter_and_version_valid_for_only"}


def inspect(source, output_root):
    source = Path(source)
    output_root = Path(output_root)
    # Do not follow caller-supplied aliases into unrelated/private stores.
    if source != source.resolve() or output_root != output_root.resolve():
        raise ValueError("path_rejected")
    device_root = Path.home() / f"Library/Developer/CoreSimulator/Devices/{DEVICE}/data/Containers/Data/Application"
    if device_root != device_root.resolve() or not source.is_relative_to(device_root):
        raise ValueError("source_rejected")
    relative = source.relative_to(device_root).parts
    if len(relative) != 4 or relative[1:] != ("Library", "HTTPStorages", "com.lkurczab.patternly") or str(uuid.UUID(relative[0])).upper() != relative[0]:
        raise ValueError("source_rejected")
    if not str(output_root).startswith("/private/tmp/") or not output_root.is_dir():
        raise ValueError("output_rejected")
    stat = output_root.stat()
    if stat.st_uid != os.getuid() or stat.st_mode & 0o077:
        raise ValueError("output_permissions_rejected")
    entries = sorted(p.name for p in source.iterdir())
    if entries != sorted(FILES) or any((source / name).is_symlink() for name in FILES):
        raise ValueError("source_files_rejected")
    before = {name: digest(source / name) for name in FILES}
    copied = Path(tempfile.mkdtemp(prefix="http-copy-", dir=output_root))
    for name in FILES:
        with (source / name).open("rb") as original, os.fdopen(os.open(copied / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), "wb") as output:
            shutil.copyfileobj(original, output)
    if before != {name: digest(source / name) for name in FILES} or before != {name: digest(copied / name) for name in FILES}:
        raise ValueError("copy_unstable")
    rows = read_copy_database(copied)
    logical = json.dumps(rows, separators=(",", ":")).encode()
    wal = (copied / FILES[1]).read_bytes()
    if len(wal) < 32:
        raise ValueError("wal_rejected")
    magic, version, page_size = struct.unpack(">III", wal[:12])
    if magic not in (0x377F0682, 0x377F0683) or version != 3007000 or not page_size or (len(wal) - 32) % (page_size + 24):
        raise ValueError("wal_rejected")
    frames = []
    for offset in range(32, len(wal), page_size + 24):
        page, database_size = struct.unpack(">II", wal[offset:offset + 8])
        frames.append({"page": page, "commitDatabasePages": database_size,
                       "pageSha256": hashlib.sha256(wal[offset + 24:offset + 24 + page_size]).hexdigest()})
    return {"schema": "patternly.http-storage-attribution.v1", "copy": str(copied),
            "stableCopy": True, "sourceSha256": before, "tables": ["alt_services"],
            "rowCount": len(rows), "logicalSha256": hashlib.sha256(logical).hexdigest(),
            "classification": "empty_partition_public_clients3_google_com_443_connection_metadata",
            "wal": {"pageSize": page_size, "frameCount": len(frames),
                    "pageNumbers": sorted({frame["page"] for frame in frames}),
                    "framesSha256": hashlib.sha256(json.dumps(frames, separators=(",", ":")).encode()).hexdigest()}}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--compare", action="store_true", help="Compare two private receipts; reject changes beyond SQLite header counters.")
    parser.add_argument("source")
    parser.add_argument("output_root")
    args = parser.parse_args()
    try:
        print(json.dumps(compare(args.source, args.output_root) if args.compare else inspect(args.source, args.output_root), indent=2))
    except Exception as error:
        allowed = {"path_rejected", "source_rejected", "output_rejected", "output_permissions_rejected", "source_files_rejected", "copy_unstable", "copy_integrity_rejected", "schema_rejected", "unclassified_record", "wal_rejected", "wal_comparison_unclassified"}
        print(json.dumps({"stage": "http_storage_copy", "category": str(error) if str(error) in allowed else "inspection_unavailable"}))
        raise SystemExit(1)
