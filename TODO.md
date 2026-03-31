# ToDo

What still needs to be completed.

- [ ] Implement "Ask all" vs "Ask one" on the card and "ask in secret"
- [ ] Actually ask the correct person or everyone (currently its asking everyone even after selecting the one person.)
- [ ] Ask one should be the default.  Add icons to the cards to indicate which is which.
- [ ] Decide what to do after you guess correctly or incorrectly.  Then implement this.
- [ ] Card art/display for tribe and number cards.
- [ ] Get a nicely styled pop-up that displays the current question for everyone to see, or at least those players who are allowed to see it (so only one player if its an ask in secret).
- [ ] Yes/no indicators should more clearly identify which player gave which answer.  Keep all "yes" answers at the top and all "no" answers at the bottom, and then order them by player color within those groups.  Maybe add a small icon to indicate which player gave which answer.
- [ ] Ensure that we don't update the server more than we need to.  We can check whether an answer given is correct just in the client and only send a message to the server if the answer is correct, and then have the server update the game state and notify all clients of the new game state.  This way we avoid sending messages to the server for incorrect guesses, which should reduce unnecessary server load and network traffic.
