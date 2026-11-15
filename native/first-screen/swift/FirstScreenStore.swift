// T2.5: keychain and file-system access for the native first screen.
// Reads use exactly the items `expo-secure-store` writes for `encryptedStorageNative.ts`
// (generic password, service `<keychainService>:no-auth`, account = generic = UTF-8 key).
// The record itself lives in its own service and is written only by React Native through
// the `PatternlyFirstScreen` sink (stage 4). Native code never logs stored values.
import Foundation
import Security

enum FirstScreenKeychain {
  static let storageService = "com.lkurczab.patternly.encrypted-storage:no-auth"
  static let recordService = "com.lkurczab.patternly.first-screen"
  static let recordAccount = "record.v2"

  private static func baseQuery(service: String, account: String) -> [String: Any] {
    let key = Data(account.utf8)
    return [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrGeneric as String: key,
      kSecAttrAccount as String: key,
    ]
  }

  static func read(service: String, account: String) -> Data? {
    var query = baseQuery(service: service, account: account)
    query[kSecMatchLimit as String] = kSecMatchLimitOne
    query[kSecReturnData as String] = true
    var result: CFTypeRef?
    guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess else { return nil }
    return result as? Data
  }

  /// Replaces the record. Returns false when the keychain refused it (React Native then clears).
  static func writeRecord(_ data: Data) -> Bool {
    let query = baseQuery(service: recordService, account: recordAccount)
    let attributes: [String: Any] = [
      kSecValueData as String: data,
      kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
    ]
    let status = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
    if status == errSecSuccess { return true }
    guard status == errSecItemNotFound else { return false }
    var insert = query
    attributes.forEach { insert[$0.key] = $0.value }
    return SecItemAdd(insert as CFDictionary, nil) == errSecSuccess
  }

  static func clearRecord() {
    _ = SecItemDelete(baseQuery(service: recordService, account: recordAccount) as CFDictionary)
  }
}

/// Production source: keychain plus `Documents/mmkv` (the NitroMmkv root on iOS).
public struct FirstScreenDeviceSource: FirstScreenValueSource {
  public init() {}

  public func record() -> Data? { FirstScreenKeychain.read(service: FirstScreenKeychain.recordService, account: FirstScreenKeychain.recordAccount) }
  public func logoutControl() -> Data? { FirstScreenKeychain.read(service: FirstScreenKeychain.storageService, account: "patternly.local-logout-control.v2") }
  public func registry(_ slot: String) -> Data? { FirstScreenKeychain.read(service: FirstScreenKeychain.storageService, account: "patternly.profile-root.v1.\(slot)") }
  public func manifest(_ slot: String) -> Data? { FirstScreenKeychain.read(service: FirstScreenKeychain.storageService, account: "patternly.storage.manifest.\(slot)") }

  public func slotFileExists(_ mmkvId: String) -> Bool {
    guard let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first else { return false }
    return FileManager.default.fileExists(atPath: documents.appendingPathComponent("mmkv").appendingPathComponent(mmkvId).path)
  }
}

public enum FirstScreenStore {
  /// The one read before the first native frame (design doc §1, budget ≤ 50 ms).
  public static func load(nowMs: Double = Date().timeIntervalSince1970 * 1000) -> FirstScreenDecision {
    decideFirstScreen(source: FirstScreenDeviceSource(), nowMs: nowMs)
  }

  public static func write(_ json: String) -> Bool {
    let data = Data(json.utf8)
    guard data.count <= firstScreenMaxBytes else { clear(); return false }
    return FirstScreenKeychain.writeRecord(data)
  }

  public static func clear() { FirstScreenKeychain.clearRecord() }
}
