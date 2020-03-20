#!/bin/bash
content=$(git log -1 --pretty=%B)
if  [[ $content == ticket-* ]] || [[ $content == SITUMWB-* ]] || [[ $content == SITUMEWB-* ]] || [[ $content == Merge* ]] || [[ $content == "Initial commit" ]] ;
then
    echo 'Valid commit message'
else
    echo "Invalid commit message. Make sure your commit message starts with 'ticket-' (use git commit --amend and git push -f)."
    echo "Make sure you know what you do or ask a colleague if you're unsure!"
    exit 1
fi
