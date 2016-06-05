
set -u -e 

[ -d lib ] && cd lib 

pwd | grep '/lib$'

  git remote -v 
  git status | sed '/^$/d' |
  git status | grep 'Modified: ' 
  for file in `git status | sed '/^$/d' | grep 'Modified: ' | sed -n 's/Modified: \(.*\)/\1/'`
  do
    echo "Modified $file"
  done


