#!/bin/bash

_tabalot () {
    COMPREPLY=($(
		"$1" --tabalot $(( $COMP_CWORD - 1 )) "${COMP_WORDS[@]:1}" 2> /dev/null
    ))
}

if [ -f ~/.tabalot/bin ]; then
	while read app; do
		complete -F _tabalot "$app"
	done < ~/.tabalot/bin
fi
