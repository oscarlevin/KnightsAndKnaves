/*
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * KnightsAndKnaves implementation : © Oscar Levin oscar.levin@gmail.com, Tyler Markkanen tyler.j.markkanen@gmail.com
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 */
declare namespace BGA {

	/** Goto {@link Gamedatas} or hover name for info. */
	interface Gamedatas extends Record<string, any> {
		// NOTE: need something here, see step 6.4 of reversi tutorial.
	}

	/** Goto {@link NotifTypes} or hover name for info. */
	interface NotifTypes {
		[name: string]: any; // RECOMMENDED: comment out this line to type notifications specific to it's name using BGA.Notif<"name">.
	}

	/** Goto {@link GameSpecificIdentifiers} or hover name for info. */
	interface GameSpecificIdentifiers {
		// CounterNames: 'foo' | 'bar' | 'bread' | 'butter';
	}


}