#!/bin/bash
git init
git remote add origin https://github.com/biswas-sukanta/NBHomestays.git
git add .
git commit -m "Initial Release: North Bengal Homestays V1.0 (Sanitized)"
git branch -M main
echo "Pushing to GitHub... (You may need to enter your Personal Access Token)"
git push -u origin main --force
