// Planning target: same-direction read/write pointers for stable filtering, sorted duplicate removal, logical lengths, and unspecified suffixes after compaction.
// Invariant: positions before write contain the accepted output from the processed prefix; diagnose advancing write for rejects and overwriting unread input.
// Target question count: 18. Avoid full partitioning and linked-list compaction.
export const sameDirectionReadWriteCompactionQuestions = [];
