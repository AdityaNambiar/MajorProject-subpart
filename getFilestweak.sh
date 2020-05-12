TYPES="$(git ls-tree HEAD . | awk '{ print $2 }')"
#echo $TYPES
set -- $TYPES
FILES="$(git ls-tree --name-only HEAD .)";
IFS="$(printf "\n\b")";
for f in $FILES; 
do    
	str="$(git log -1 --pretty=format:"%s%x28%x7c%x29%x2D%x7c%x2D%x28%x7c%x29%cr" $f)";  
	printf "%s(|)-|-(|)%s(|)-|-(|)%s\n" "$f" "$str" "$1";
	shift 
done

