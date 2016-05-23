
set -u -e 

[ -d lib ] && cd lib

git remote -v | grep 'evanx/rhlibv.git'

pwd

c1commit() {
  message="$1"
  git remote set-url origin git@github.com:evanx/rhlibv.git
  git add -A
  git commit -m "$message" || echo "commit exit code $?"
  git remote -v 
  git push
  git remote set-url origin https://github.com/evanx/rhlibv.git
  echo; echo "done lib"
  git status
}

if [ $# -eq 1 ]
then
  c1commit "$1"
else
  echo "usage: message"
fi 
