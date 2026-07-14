import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const keyIdentityAndCompositeKeysQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-key-identity-composite-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "understand_javascript_map_key_equality",
    "secondarySkillAtomIds": [
      "distinguish_primitive_value_from_object_identity",
      "recognize_valid_map_key_types"
    ],
    "type": "single_choice",
    "prompt": "Which statement about JavaScript Map keys is precise?",
    "options": [
      {
        "id": "any_value_same_value_zero_and_identity",
        "text": "Any JavaScript value can be a Map key; primitive keys use SameValueZero equality, while objects and functions are matched by reference identity.",
        "isCorrect": true
      },
      {
        "id": "strings_only",
        "text": "Map keys must be strings, and every other key is converted to a string.",
        "isCorrect": false
      },
      {
        "id": "objects_structural",
        "text": "Object and array keys are compared structurally by their properties and elements.",
        "isCorrect": false
      },
      {
        "id": "primitives_reference",
        "text": "Primitive keys are compared by reference identity, while objects are compared by value.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Map accepts primitive and reference values without coercing all keys into strings.",
      "mentalModelCorrection": "Primitive equality and object identity use different runtime semantics. Equal-looking objects are not automatically the same key.",
      "mistakeTypes": [
        "javascript_map_key_equality_mismatch"
      ],
      "nextAction": "Classify the proposed key as a primitive value or a reference value before predicting lookup behavior.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-key-identity-composite-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_map_primitive_key_types",
    "secondarySkillAtomIds": [
      "avoid_implicit_key_coercion_assumption",
      "reason_about_map_size"
    ],
    "type": "edge_case_drill",
    "prompt": "What is the final size of this Map?\n\nconst state = new Map<unknown, string>();\n\nstate.set(1, \"number\");\nstate.set(\"1\", \"string\");\nstate.set(true, \"boolean\");",
    "options": [
      {
        "id": "size_three",
        "text": "3, because 1, \"1\", and true are distinct Map keys.",
        "isCorrect": true
      },
      {
        "id": "size_one",
        "text": "1, because every primitive key is converted to the string \"1\".",
        "isCorrect": false
      },
      {
        "id": "size_two",
        "text": "2, because 1 and \"1\" are equal after coercion.",
        "isCorrect": false
      },
      {
        "id": "invalid_keys",
        "text": "The code throws because a Map cannot mix key types.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Map does not apply loose equality or string coercion when comparing keys.",
      "mentalModelCorrection": "Numeric, string, and boolean values remain distinct keys even when their textual representations resemble one another.",
      "mistakeTypes": [
        "map_keys_assumed_to_be_string_coerced"
      ],
      "nextAction": "Compare both the primitive type and value of each key.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-key-identity-composite-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "handle_same_value_zero_map_keys",
    "secondarySkillAtomIds": [
      "reason_about_nan_map_keys",
      "reason_about_signed_zero_map_keys"
    ],
    "type": "edge_case_drill",
    "prompt": "What is the final size of this Map?\n\nconst state = new Map<number, string>();\n\nstate.set(NaN, \"first NaN\");\nstate.set(Number(\"missing\"), \"second NaN\");\nstate.set(0, \"zero\");\nstate.set(-0, \"negative zero\");",
    "options": [
      {
        "id": "size_two",
        "text": "2, because NaN matches NaN in Map key equality, and 0 and -0 are treated as the same key.",
        "isCorrect": true
      },
      {
        "id": "size_four",
        "text": "4, because every insertion expression creates a distinct key.",
        "isCorrect": false
      },
      {
        "id": "size_three",
        "text": "3, because NaN keys match but 0 and -0 remain separate.",
        "isCorrect": false
      },
      {
        "id": "nan_invalid",
        "text": "The code throws because NaN cannot be used as a Map key.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "JavaScript Map uses SameValueZero rather than === for numeric key comparison.",
      "mentalModelCorrection": "Under SameValueZero, NaN equals NaN for key matching, and positive and negative zero share one key.",
      "mistakeTypes": [
        "same_value_zero_behavior_missed"
      ],
      "nextAction": "Account explicitly for NaN and signed zero when numeric edge cases affect key identity.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-key-identity-composite-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "understand_object_key_reference_identity",
    "secondarySkillAtomIds": [
      "distinguish_structural_equality_from_identity",
      "predict_object_map_lookup"
    ],
    "type": "single_choice",
    "prompt": "What does this code return?\n\nconst state = new Map<object, string>();\n\nstate.set({ id: 7 }, \"stored\");\n\nconst result = state.get({ id: 7 });",
    "options": [
      {
        "id": "undefined_new_reference",
        "text": "undefined, because the lookup uses a different object reference even though its property values are equal.",
        "isCorrect": true
      },
      {
        "id": "stored_structural_match",
        "text": "\"stored\", because Map compares object properties structurally.",
        "isCorrect": false
      },
      {
        "id": "throws_duplicate_shape",
        "text": "It throws because two objects cannot have the same property structure.",
        "isCorrect": false
      },
      {
        "id": "stored_after_serialization",
        "text": "\"stored\", because Map automatically serializes object keys.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Each object literal creates a new reference.",
      "mentalModelCorrection": "Equal property contents do not imply identical object keys in JavaScript or TypeScript.",
      "mistakeTypes": [
        "object_keys_assumed_structurally_equal"
      ],
      "nextAction": "Check whether insertion and lookup reuse the exact same object instance.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-key-identity-composite-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "reuse_reference_identity_map_key",
    "secondarySkillAtomIds": [
      "predict_object_map_lookup",
      "distinguish_same_reference_from_equal_content"
    ],
    "type": "code_reading",
    "prompt": "What does this code return?\n\nconst key = { id: 7 };\nconst state = new Map<object, string>();\n\nstate.set(key, \"stored\");\n\nconst result = state.get(key);",
    "options": [
      {
        "id": "stored_same_reference",
        "text": "\"stored\", because insertion and lookup use the same object reference.",
        "isCorrect": true
      },
      {
        "id": "undefined_objects_never_match",
        "text": "undefined, because objects can never be retrieved from a Map.",
        "isCorrect": false
      },
      {
        "id": "undefined_map_clones_key",
        "text": "undefined, because Map clones object keys during insertion.",
        "isCorrect": false
      },
      {
        "id": "throws_mutable_key",
        "text": "It throws because mutable objects cannot be used as keys.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The exact reference stored as the key is reused for lookup.",
      "mentalModelCorrection": "Object keys are valid and stable as long as callers retain and reuse the same identity.",
      "mistakeTypes": [
        "same_reference_lookup_not_recognized"
      ],
      "nextAction": "Track reference identity separately from the contents stored inside the referenced object.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-key-identity-composite-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "understand_tuple_key_reference_identity",
    "secondarySkillAtomIds": [
      "distinguish_typescript_tuple_type_from_runtime_equality",
      "avoid_fresh_array_map_keys"
    ],
    "type": "mistake_review",
    "prompt": "A TypeScript Map uses tuple keys:\n\nconst state = new Map<readonly [string, number], string>();\n\nstate.set([\"team\", 3], \"stored\");\n\nconst result = state.get([\"team\", 3]);\n\nWhy is result undefined?",
    "options": [
      {
        "id": "tuples_are_arrays_by_reference",
        "text": "At runtime, both tuples are separate array objects, and Map compares array keys by reference identity.",
        "isCorrect": true
      },
      {
        "id": "readonly_prevents_lookup",
        "text": "Readonly tuples can be inserted but cannot be retrieved.",
        "isCorrect": false
      },
      {
        "id": "tuple_elements_wrong_types",
        "text": "The string and number elements cannot appear in one tuple key.",
        "isCorrect": false
      },
      {
        "id": "map_ignores_tuple_values",
        "text": "Map ignores all tuple elements and compares only tuple length.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "TypeScript tuple syntax changes static typing but not JavaScript's runtime array identity semantics.",
      "mentalModelCorrection": "A tuple type does not create structural key equality. Fresh tuple literals remain distinct references.",
      "mistakeTypes": [
        "typescript_tuple_assumed_structural_map_key"
      ],
      "nextAction": "Use a canonical primitive encoding, a nested Map, or a reused tuple reference.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-key-identity-composite-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_nested_map_for_composite_key",
    "secondarySkillAtomIds": [
      "preserve_composite_component_types",
      "avoid_composite_string_collision"
    ],
    "type": "solution_comparison",
    "prompt": "State is indexed by an ordered pair consisting of:\n\n- a string category,\n- a numeric level.\n\nWhich representation avoids string encoding while preserving both component identities?",
    "options": [
      {
        "id": "nested_map",
        "text": "Map<string, Map<number, State>>, using the category for the outer lookup and the level for the inner lookup.",
        "isCorrect": true
      },
      {
        "id": "concatenate_without_boundaries",
        "text": "Map<string, State> with category + level as the key.",
        "isCorrect": false
      },
      {
        "id": "fresh_tuple_key",
        "text": "Map<[string, number], State> using a newly created tuple for every lookup.",
        "isCorrect": false
      },
      {
        "id": "set_of_components",
        "text": "A Set containing the category and level as separate entries.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Each component already has a valid primitive key type and can be looked up independently.",
      "mentalModelCorrection": "Nested Maps represent composite keys without flattening component types into an ambiguous string.",
      "mistakeTypes": [
        "unsafe_composite_key_representation"
      ],
      "nextAction": "Use one Map level per composite-key component when structured lookup is clearer than serialization.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-key-identity-composite-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "detect_composite_key_concatenation_collision",
    "secondarySkillAtomIds": [
      "preserve_component_boundaries",
      "review_composite_key_encoding"
    ],
    "type": "mistake_review",
    "prompt": "A composite key is constructed as:\n\nconst key = first + second;\n\nWhich two different input pairs demonstrate an application-level collision?",
    "options": [
      {
        "id": "ab_c_and_a_bc",
        "text": "[\"ab\", \"c\"] and [\"a\", \"bc\"], because both produce \"abc\".",
        "isCorrect": true
      },
      {
        "id": "a_b_and_a_b",
        "text": "[\"a\", \"b\"] and [\"a\", \"b\"], because equivalent inputs must not share a key.",
        "isCorrect": false
      },
      {
        "id": "a_b_and_b_a",
        "text": "[\"a\", \"b\"] and [\"b\", \"a\"], because concatenation always sorts components.",
        "isCorrect": false
      },
      {
        "id": "empty_and_nonempty",
        "text": "[\"\", \"a\"] and [\"\", \"b\"], because all empty first components produce the same key.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The encoding removes information about where the first component ends.",
      "mentalModelCorrection": "Different composite values can become the exact same primitive key before Map hashing is even involved.",
      "mistakeTypes": [
        "component_boundaries_lost_in_key"
      ],
      "nextAction": "Use structured serialization, escaping, length prefixes, or nested Maps.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-key-identity-composite-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "reject_unsafe_delimiter_encoding",
    "secondarySkillAtomIds": [
      "prevent_application_level_key_collision",
      "choose_collision_safe_encoding"
    ],
    "type": "solution_comparison",
    "prompt": "Two arbitrary strings form an ordered composite key.\n\nSolution A:\nconst key = first + \"|\" + second;\n\nSolution B:\nconst key = JSON.stringify([first, second]);\n\nThe strings themselves may contain \"|\". Which review is correct?",
    "options": [
      {
        "id": "structured_array_encoding_safer",
        "text": "Solution B preserves the two string boundaries and escapes their contents, while Solution A is ambiguous unless the delimiter is escaped or forbidden.",
        "isCorrect": true
      },
      {
        "id": "delimiter_always_safe",
        "text": "Solution A is always collision-safe because a visible separator cannot occur inside a string component.",
        "isCorrect": false
      },
      {
        "id": "json_loses_component_order",
        "text": "Solution B is invalid because JSON array serialization sorts the two strings.",
        "isCorrect": false
      },
      {
        "id": "both_use_reference_identity",
        "text": "Both fail because string Map keys are compared by reference identity.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The delimiter belongs to the supported component alphabet and is not escaped.",
      "mentalModelCorrection": "A separator is safe only when the encoding makes component boundaries unambiguous for every valid input.",
      "mistakeTypes": [
        "delimiter_collision_not_considered"
      ],
      "nextAction": "Define escaping, length-prefixing, or structured serialization as part of the key format.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-key-identity-composite-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "scope_serialized_key_to_supported_domain",
    "secondarySkillAtomIds": [
      "review_json_stringify_key_domain",
      "preserve_primitive_type_information"
    ],
    "type": "single_choice",
    "prompt": "For which explicitly stated domain is JSON.stringify([first, second]) a straightforward collision-safe key for an ordered pair?",
    "options": [
      {
        "id": "two_arbitrary_strings",
        "text": "Two arbitrary strings, because JSON array syntax and escaping preserve both order and component boundaries.",
        "isCorrect": true
      },
      {
        "id": "all_javascript_values",
        "text": "All possible JavaScript values, including BigInt, functions, symbols, undefined, NaN, and cyclic objects.",
        "isCorrect": false
      },
      {
        "id": "structurally_equal_objects_automatically",
        "text": "Arbitrary objects whose properties should be compared structurally, without first canonicalizing property order.",
        "isCorrect": false
      },
      {
        "id": "cyclic_graphs",
        "text": "Arbitrary cyclic object graphs, because JSON.stringify preserves reference cycles.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The safety of a serialized key depends on the exact supported value domain.",
      "mentalModelCorrection": "JSON serialization is useful for some controlled primitive structures, but it is not a universal structural-key function.",
      "mistakeTypes": [
        "serialized_key_domain_not_specified"
      ],
      "nextAction": "Document supported types and special values before adopting a serialization format.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-key-identity-composite-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "canonicalize_unordered_composite_key",
    "secondarySkillAtomIds": [
      "normalize_symmetric_components",
      "ensure_equivalent_pairs_share_key"
    ],
    "type": "single_choice",
    "prompt": "The pairs [\"alice\", \"bob\"] and [\"bob\", \"alice\"] should represent the same undirected relationship. How should the key be constructed?",
    "options": [
      {
        "id": "canonical_order_then_encode",
        "text": "Put the two names into a deterministic order and then encode the ordered result safely.",
        "isCorrect": true
      },
      {
        "id": "preserve_original_order",
        "text": "Encode the names in their original order so the two equivalent inputs receive different keys.",
        "isCorrect": false
      },
      {
        "id": "use_first_name_only",
        "text": "Use only whichever name appears first.",
        "isCorrect": false
      },
      {
        "id": "fresh_array_key",
        "text": "Use a newly created [first, second] array directly as the Map key for every lookup.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Component order is irrelevant to the application's equivalence relation.",
      "mentalModelCorrection": "Canonicalization must remove irrelevant permutations before the components are serialized or indexed.",
      "mistakeTypes": [
        "unordered_pair_not_canonicalized"
      ],
      "nextAction": "Normalize equivalent component orders into one deterministic representation.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-key-identity-composite-012",
    "learningStage": "foundations",
    "primarySkillAtomId": "canonicalize_structural_object_key",
    "secondarySkillAtomIds": [
      "avoid_property_order_sensitive_serialization",
      "normalize_object_properties"
    ],
    "type": "mistake_review",
    "prompt": "Two objects should be grouped by equal property names and values, regardless of insertion order:\n\nconst first = { x: 1, y: 2 };\n\nconst second: Record<string, number> = {};\nsecond.y = 2;\nsecond.x = 1;\n\nWhy can JSON.stringify(item) be an insufficient canonical key?",
    "options": [
      {
        "id": "property_order_can_differ",
        "text": "The objects can serialize their properties in different orders, producing different strings despite the intended structural equivalence.",
        "isCorrect": true
      },
      {
        "id": "json_removes_values",
        "text": "JSON.stringify always removes numeric property values.",
        "isCorrect": false
      },
      {
        "id": "objects_cannot_be_serialized",
        "text": "Plain JavaScript objects cannot be passed to JSON.stringify.",
        "isCorrect": false
      },
      {
        "id": "map_compares_strings_by_reference",
        "text": "The serialized strings fail because Map compares strings by reference identity.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The intended equivalence ignores construction history, but raw serialization may preserve property enumeration order.",
      "mentalModelCorrection": "Structural canonicalization requires a deterministic property order, often recursively for nested values.",
      "mistakeTypes": [
        "raw_object_serialization_assumed_canonical"
      ],
      "nextAction": "Sort relevant property names and canonicalize nested structures before serialization.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-key-identity-composite-013",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_record_property_keys_from_map_keys",
    "secondarySkillAtomIds": [
      "avoid_object_property_key_coercion",
      "preserve_primitive_key_types"
    ],
    "type": "solution_comparison",
    "prompt": "A state container must distinguish numeric key 1 from string key \"1\".\n\nWhich review is correct?",
    "options": [
      {
        "id": "map_preserves_type_record_coerces",
        "text": "Map can distinguish them, while ordinary object or Record property access converts the numeric property key into the string \"1\".",
        "isCorrect": true
      },
      {
        "id": "record_preserves_both",
        "text": "A Record stores numeric and string property keys as distinct identities.",
        "isCorrect": false
      },
      {
        "id": "map_coerces_both",
        "text": "Map also converts both keys into the string \"1\".",
        "isCorrect": false
      },
      {
        "id": "neither_accepts_numbers",
        "text": "Neither representation permits numeric keys.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Ordinary JavaScript object property keys are strings or symbols, while Map preserves arbitrary key values.",
      "mentalModelCorrection": "TypeScript Record typing does not change JavaScript's runtime property-key coercion.",
      "mistakeTypes": [
        "record_and_map_key_semantics_conflated"
      ],
      "nextAction": "Choose Map when runtime key type identity must remain observable.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-key-identity-composite-014",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_representation_for_structural_key_equality",
    "secondarySkillAtomIds": [
      "distinguish_structural_equality_from_reference_identity",
      "choose_canonical_or_nested_key_representation"
    ],
    "type": "solution_comparison",
    "prompt": "Different object instances should address the same Map entry whenever their complete nested contents are structurally equivalent.\n\nWhich design matches that requirement?",
    "options": [
      {
        "id": "canonical_structural_key",
        "text": "Convert each object into a deterministic, collision-safe canonical primitive representation, or use another explicit structural interning/equality mechanism.",
        "isCorrect": true
      },
      {
        "id": "raw_object_key",
        "text": "Use each object instance directly as a Map key because Map automatically performs deep equality.",
        "isCorrect": false
      },
      {
        "id": "fresh_tuple_of_properties",
        "text": "Create a fresh array of selected properties for every lookup and use that array directly as the key.",
        "isCorrect": false
      },
      {
        "id": "object_to_string",
        "text": "Use String(object), because every structurally different object receives a unique default string.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The required equality is content-based rather than reference-based.",
      "mentalModelCorrection": "JavaScript Map does not provide structural object equality. That behavior must be implemented through canonicalization, interning, or an explicit structural lookup design.",
      "mistakeTypes": [
        "reference_key_used_for_structural_contract"
      ],
      "nextAction": "Define a deterministic representation of every equivalence-relevant nested value.",
      "result": "diagnostic"
    }
  }
] as const satisfies readonly AlgorithmQuestion[];
