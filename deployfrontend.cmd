robocopy src docs /e
robocopy build\contracts docs
  #statements
git add .
git commit -m "Adding frontend files to Github Pages"
git push
