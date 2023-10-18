#!/bin/bash

cd "$(dirname $0)"

# Verifique se foram fornecidos os argumentos corretos
if [ $# -ne 1 ]; then
  echo "Uso: $0 <programa_binario>"
  exit 1
fi

# Nome do programa binário
binary="./$1"

# Verifique se o programa binário existe
if [ ! -x "$binary" ]; then
  echo "O programa binário '$binary' não foi encontrado ou não é executável."
  exit 1
fi

for test in *.in; do
    testname="${test%.*}"
    output_correction="${testname}.out"
    output="$($binary < $testname.in)"
    # if diff --strip-trailing-cr "$temp_output" "$output_correction" > /dev/null; then
    if [ "$output" -ne "$(cat $output_correction)" ]; then
        exit 2
    fi
done

exit 0

# 