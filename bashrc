#!/bin/bash

_tabalot () {
	local opts="$("$1" --tabalot $(( $COMP_CWORD - 1 )) "${COMP_WORDS[@]:1}" 2> /dev/null)"
	local IFS=$'\n'
	COMPREPLY=($(echo "$opts"))
}

if [ -f ~/.tabalot/bin ]; then
	while read app; do
		complete -F _tabalot "$app"
	done < ~/.tabalot/bin
fi
