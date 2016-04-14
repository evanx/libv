
set -u -e 

[ $# -eq 1 ]

pwd | grep -q '/libv$'

  git add -A
  git commit -m "$1"
  git push
