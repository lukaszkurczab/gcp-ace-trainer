#!/bin/bash
# Run from app root. Continues ONLY the observed native25 session :2, q3..q10.
# prepare-current-question checks current device session/position/question and stable-ID membership before each legal UI answer.
set -euo pipefail
native25_packet=docs/active/BIZQ-01/native-common-runtime-25
native25_device=7F315654-3175-4F3C-BB24-B0263F59360C
native25_node=/opt/homebrew/opt/node@22/bin/node
for native25_ordinal in {3..10}; do
  if [ "$native25_ordinal" -ne 3 ]; then
    /opt/homebrew/bin/maestro --udid "$native25_device" hierarchy > "/private/tmp/bizq25-q${native25_ordinal}-hierarchy.txt" 2>&1
  fi
  "$native25_node" --import tsx "$native25_packet/prepare-current-question.cjs" "/private/tmp/bizq25-q${native25_ordinal}-hierarchy.txt" "$native25_ordinal"
  /opt/homebrew/bin/maestro --udid "$native25_device" test --test-output-dir "/private/tmp/bizq25-q${native25_ordinal}" --debug-output "/private/tmp/bizq25-q${native25_ordinal}" "$native25_packet/question-${native25_ordinal}.yaml" > "$native25_packet/QUESTION-${native25_ordinal}.log" 2>&1
  printf 'Observed own question %s accepted by native runner and continued.\n' "$native25_ordinal"
done
