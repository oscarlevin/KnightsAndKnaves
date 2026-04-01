# ToDo

## What still needs to be completed.

- [ ] Better styling: space between cards, betting fonts for cards, nicer pop-ups (use the actual cards).  Pop-ups should not stretch the entire width of the screen, but should be more compact and centered.  Also add a pop-up for when you select a card to play that shows the card larger in the middle of the screen before you confirm you want to play it.
- [ ] Actually add good art for the card pngs.



## Completed

- [x] Implement "ask in secret".  This will require a blurred out card (or face down card) for players that were not part of the secret.
- [x] Get a new question card after one was asked about.
- [x] Add different art for the different types of cards (ask in secret, ask everyone, tribe cards, number cards).
  - [x] Ask one should be the default.  Add icons to the cards to indicate which is which.
- [x] Decide what to do after you guess correctly or incorrectly.  Then implement this.
- [x] Get a nicely styled pop-up that displays the current question for everyone to see, or at least those players who are allowed to see it (so only one player if its an ask in secret).  When the current player selects the card, it should be displayed larger in the middle of the screen too before they confirm they want to play it.
- [x] Yes/no indicators should more clearly identify which player gave which answer.  Keep all "yes" answers at the top and all "no" answers at the bottom, and then order them by player color within those groups.  Maybe add a small icon to indicate which player gave which answer.
- [x] Ensure that we don't update the server more than we need to.  We can check whether an answer given is correct just in the client and only send a message to the server if the answer is correct, and then have the server update the game state and notify all clients of the new game state.  This way we avoid sending messages to the server for incorrect guesses, which should reduce unnecessary server load and network traffic.
