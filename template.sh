# Tab completion for {cmd}
#
# Auto install to bash by doing:
#  {install} --save
#
# Which similar to
#  {install} > {completionDir}/{cmd}
#
# Remember to source {profile} or restart your terminal afterwards
# Manual install by adding the following to {profile} {zshrc-help}

if type complete &>/dev/null; then
	_{cmd}_completion () {
		COMPREPLY=()
		local output output_file
		output="$({completion} completion -- $(( $COMP_CWORD - 1 )) "${COMP_WORDS[@]:1}" 2> /dev/null)"
		[ $? == 15 ] && output_file=yes
		local IFS=$'\n'
		output=("$output")

		for word in ${output[@]}; do
			COMPREPLY+=("$word")
		done

		if [ "$output_file" == "yes" ]; then
			type compopt >&/dev/null && compopt -o filenames 2> /dev/null || compgen -f /non-existing-dir/ > /dev/null
		fi
	}	
	complete -F _{cmd}_completion {cmd}
elif type compdef &>/dev/null; then
	_{cmd}_completion () {
		compadd -- $({completion} completion -- $(( CURRENT - 2 )) "${words[@]:1}" 2> /dev/null)
	}
	compdef _{cmd}_completion {cmd}
fi
