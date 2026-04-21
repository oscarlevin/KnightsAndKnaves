/*
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * KnightsAndKnaves implementation : © Oscar Levin oscar.levin@gmail.com, Tyler Markkanen tyler.j.markkanen@gmail.com
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 */

/// <amd-module name="bgagame/knightsandknaves"/>

import Gamegui = require('ebg/core/gamegui');
import "ebg/counter";
import "ebg/stock";
import { deckMap, imagesPerRow } from './deck_base';

const NUM_QUESTION_TYPES = 3; // ask-one, ask-all, ask-in-secret
const NUM_QUESTIONS = 18;

class KnightsAndKnaves extends Gamegui
{
	cardwidth: number;
	cardheight: number;
	playerHand: any;
	commonArea: any;
	playerTribe: any;
	playerNumber: any;
	currentState: string;
	cardDataById: Record<string, { type: string; type_arg: string }>;
	currentQuestionCardId: string | null;
	currentQuestionTargetId: string | null;
	currentQuestionAskerId: string | null;
	secretCardTargets: Record<string, number>;
	cardAnswers: Record<string, { playerId: string; answer: string; color: string }[]>;

	constructor(){
		super();
		this.cardwidth = 72;
		this.cardheight = 96;
		this.currentState = '';
		this.cardDataById = {};
		this.currentQuestionCardId = null;
		this.currentQuestionTargetId = null;
		this.currentQuestionAskerId = null;
		this.secretCardTargets = {};
		this.cardAnswers = {};
	}

	override setup(gamedatas: BGA.Gamedatas): void
	{
		console.log( "Starting game setup" );

		// Setting up player boards
		for (const player_id in gamedatas.players) {
			const player = gamedatas.players[player_id as any]!;
			const playerBoardDiv = $('player_board_' + player_id);
			if (playerBoardDiv) {
				dojo.place(
					`<div class="kk_player_info">
						<span class="kk_trophy_icon">🏆</span>
						<span id="trophy_count_${player_id}" class="kk_trophy_count">${(player as any).trophies || 0}</span>
					</div>`,
					playerBoardDiv
				);
				// Dim eliminated players
				if ((player as any).eliminated == 1) {
					dojo.addClass('overall_player_board_' + player_id, 'kk_eliminated');
				}
			}
		}

		// Player hand stock
		this.playerHand = new ebg.stock();
		this.playerHand.create( this, $('myhand'), this.cardwidth, this.cardheight );
		this.playerHand.setSelectionMode(1);
		this.playerHand.image_items_per_row = 1;
		this.playerHand.item_margin = 4;

		// Common area stock
		this.commonArea = new ebg.stock();
		this.commonArea.create( this, $('commonarea'), this.cardwidth, this.cardheight );
		this.commonArea.setSelectionMode(0);
		this.commonArea.image_items_per_row = 1;
		this.commonArea.item_margin = 4;

		// Player tribe card stock
		this.playerTribe = new ebg.stock();
		this.playerTribe.create( this, $('myTribe'), this.cardwidth, this.cardheight );
		this.playerTribe.setSelectionMode(0);
		this.playerTribe.image_items_per_row = 1;
		this.playerTribe.item_margin = 4;

		// Player number card stock
		this.playerNumber = new ebg.stock();
		this.playerNumber.create( this, $('myNumber'), this.cardwidth, this.cardheight );
		this.playerNumber.setSelectionMode(0);
		this.playerNumber.image_items_per_row = 1;
		this.playerNumber.item_margin = 4;

		// Use card.png as the fallback background for all stocks
		const cardImg = g_gamethemeurl + 'img/card.png';
		this.playerHand.addItemType(0, 0, cardImg, 0);
		this.commonArea.addItemType(0, 0, cardImg, 0);
		this.playerTribe.addItemType(0, 0, cardImg, 0);
		this.playerNumber.addItemType(0, 0, cardImg, 0);

		// Inject overlays onto question cards
		const questions = (gamedatas as any).questions as Record<number, { description: string; code: string }>;
		const extractCardId = (divId: string) => divId.split('_item_')[1] ?? divId;
		const typeClassMap: Record<number, string> = { 1: 'kk_card_ask_one', 2: 'kk_card_ask_all', 3: 'kk_card_ask_secret' };
		const typeIconMap: Record<number, string> = { 1: '👤', 2: '👥', 3: '🤫' };

		this.playerHand.onItemCreate = (cardDiv: HTMLElement, _type: number, divId: string) => {
			const cardId = extractCardId(divId);
			const data = this.cardDataById[cardId];
			const cardType = data ? parseInt(data.type) : 1;
			const text = data ? (questions[parseInt(data.type_arg)]?.description ?? '') : '';
			cardDiv.style.removeProperty('left');
			dojo.addClass(cardDiv, typeClassMap[cardType] ?? 'kk_card_ask_one');
			cardDiv.insertAdjacentHTML('beforeend',
				`<div class="kk_card_type_icon">${typeIconMap[cardType] ?? '👤'}</div>` +
				`<div class="kk_card_content">${text}</div>`
			);
		};
		this.commonArea.onItemCreate = (cardDiv: HTMLElement, _type: number, divId: string) => {
			const cardId = extractCardId(divId);
			const data = this.cardDataById[cardId];
			const cardType = data ? parseInt(data.type) : 1;
			const text = data ? (questions[parseInt(data.type_arg)]?.description ?? '') : '';
			cardDiv.style.removeProperty('left');
			dojo.addClass(cardDiv, typeClassMap[cardType] ?? 'kk_card_ask_one');
			cardDiv.insertAdjacentHTML('beforeend',
				`<div class="kk_card_type_icon">${typeIconMap[cardType] ?? '👤'}</div>` +
				`<div class="kk_card_content">${text}</div>`
			);
		};
		this.playerTribe.onItemCreate = (cardDiv: HTMLElement, _type: number, divId: string) => {
			const data = this.cardDataById[extractCardId(divId)];
			const tribe = data?.type ?? '';
			const isKnight = tribe === 'knight';
			dojo.addClass(cardDiv, isKnight ? 'kk_card_knight' : 'kk_card_knave');
			cardDiv.insertAdjacentHTML('beforeend',
				`<div class="kk_card_content kk_identity_content">${isKnight ? '⚔️ Knight' : '🎭 Knave'}</div>`
			);
		};
		this.playerNumber.onItemCreate = (cardDiv: HTMLElement, _type: number, divId: string) => {
			const data = this.cardDataById[extractCardId(divId)];
			const num = data?.type_arg ?? '';
			dojo.addClass(cardDiv, 'kk_card_number');
			cardDiv.insertAdjacentHTML('beforeend',
				`<div class="kk_card_content kk_number_content">${num}</div>`
			);
		};

		// Load secret card targets and current question state
		this.secretCardTargets = (gamedatas as any).secretCardTargets ?? {};
		const lastPlayedCard = (gamedatas as any).lastPlayedCard;
		if (lastPlayedCard) {
			this.currentQuestionCardId = String(lastPlayedCard);
			this.currentQuestionTargetId = String((gamedatas as any).lastPlayedTarget || '');
			// Find the asker from commonarea (location_arg = player_id who played it)
			const playedCardData = (gamedatas as any).commonarea?.[lastPlayedCard];
			if (playedCardData) {
				this.currentQuestionAskerId = String(playedCardData.location_arg);
			}
		}

		// Load cards in player's hand
		for (const i in this.gamedatas!['hand']) {
			const card = this.gamedatas!['hand'][i];
			this.cardDataById[card.id] = { type: card.type, type_arg: card.type_arg };
			this.playerHand.addToStockWithId(0, card.id);
		}

		// Load cards in common area
		for (const i in this.gamedatas!['commonarea']) {
			const card = this.gamedatas!['commonarea'][i];
			this.cardDataById[card.id] = { type: card.type, type_arg: card.type_arg };
			this.commonArea.addToStockWithId(0, card.id);
			// For secret cards, hide question from non-participants
			if (parseInt(card.type) === 3) {
				const askerPlayerId = String(card.location_arg);
				const targetPlayerId = String(this.secretCardTargets[card.id] ?? '');
				const isParticipant = askerPlayerId === String(this.player_id) || targetPlayerId === String(this.player_id);
				if (!isParticipant) {
					const el = $('commonarea_item_' + card.id);
					if (el) dojo.addClass(el, 'kk_secret_hidden');
				}
			}
		}

		// Load player's identity cards
		for (const i in this.gamedatas!['idtribe']) {
			const card = this.gamedatas!['idtribe'][i];
			this.cardDataById[card.id] = { type: card.type, type_arg: card.type_arg };
			this.playerTribe.addToStockWithId(0, card.id);
		}
		for (const i in this.gamedatas!['idnumber']) {
			const card = this.gamedatas!['idnumber'][i];
			this.cardDataById[card.id] = { type: card.type, type_arg: card.type_arg };
			this.playerNumber.addToStockWithId(0, card.id);
		}

		// Restore answer chips on commonarea cards from gamedatas
		if (this.gamedatas!['answers']) {
			for (const ans of this.gamedatas!['answers'] as any[]) {
				this.displayAnswerChip(ans.card_id, ans.player_id, ans.answer);
			}
		}

		// Create card selection preview overlay (shown when selecting a card to play)
		dojo.place(`
			<div id="kk_card_preview_overlay" class="kk_overlay kk_overlay_clickable" style="display:none">
				<div id="kk_card_preview" class="kk_card_preview">
					<div class="kk_card_preview_inner">
						<div id="kk_preview_card" class="kk_preview_card"></div>
						<div id="kk_preview_hint" class="kk_preview_hint"></div>
						<div id="kk_preview_actions_title" class="kk_preview_actions_title"></div>
						<div id="kk_preview_actions" class="kk_preview_actions"></div>
					</div>
				</div>
			</div>
		`, document.body);

		// Clicking outside the card preview dismisses it
		dojo.connect($('kk_card_preview_overlay')!, 'onclick', (e: MouseEvent) => {
			if ((e.target as HTMLElement).id === 'kk_card_preview_overlay') {
				this.playCardCancel(e);
			}
		});

		// Wire up selection handler
		dojo.connect( this.playerHand, 'onChangeSelection', this, 'onPlayerHandSelectionChanged' );

		this.setupNotifications();
		console.log( "Ending game setup" );
	}

	///////////////////////////////////////////////////
	//// Game & client states
	///////////////////////////////////////////////////

	override onEnteringState(...[stateName, state]: BGA.GameStateTuple<['name', 'state']>): void
	{
		console.log( 'Entering state: ' + stateName );
		this.currentState = stateName;

		switch( stateName )
		{
		case 'playerTurnAsk':
			this.hideCurrentQuestion();
			break;
		case 'targetResponse':
			// Restore currentQuestionCardId from gamedatas if not set (page reload mid-response)
			if (!this.currentQuestionCardId) {
				const lastCard = (this.gamedatas as any).lastPlayedCard;
				if (lastCard) {
					this.currentQuestionCardId = String(lastCard);
					this.currentQuestionTargetId = String((this.gamedatas as any).lastPlayedTarget || '');
				}
			}
			this.updateCurrentQuestionDisplay();
			break;
		case 'playerTurnGuess':
			this.hideCurrentQuestion();
			break;
		}
	}

	override onLeavingState(stateName: BGA.ActiveGameState["name"]): void
	{
		console.log( 'Leaving state: ' + stateName );
		if (stateName === 'targetResponse') {
			this.hideCurrentQuestion();
		}
	}

	override onUpdateActionButtons(...[stateName, args]: BGA.GameStateTuple<['name', 'args']>): void
	{
		console.log( 'onUpdateActionButtons: ' + stateName, args );

		if(!this.isCurrentPlayerActive())
			return;

		switch( stateName )
		{
			case 'playerTurnAsk':
				// Show discard option
				this.addActionButton( 'discard_button', _('Discard & Redraw'), 'onDiscardAndRedraw', undefined, false, 'gray' );
				break;
			case 'targetResponse':
				this.removeActionButtons();
				this.promptResponse();
				break;
			case 'playerTurnGuess':
				this.removeActionButtons();
				this.promptGuessOrPass();
				break;
		}
	}

	///////////////////////////////////////////////////
	//// Utility methods
	///////////////////////////////////////////////////

	changeMainBar(message: string) {
		$("generalactions")!.innerHTML = "";
		$("pagemaintitletext")!.innerHTML = message;
	}

	getCardSpritePos(cardType: number, qIndex: number): number {
		return (cardType - 1) * imagesPerRow + qIndex;
	}

	getCurrentQuestionDetails() {
		const cardId = this.currentQuestionCardId;
		if (!cardId) return null;
		const data = this.cardDataById[cardId];
		if (!data) return null;
		const questions = (this.gamedatas as any).questions as Record<number, { description: string }>;
		const text = questions[parseInt(data.type_arg)]?.description ?? '';
		if (!text) return null;
		return {
			cardId,
			cardType: parseInt(data.type),
			text
		};
	}

	showQuestionStatusForAsker() {
		const details = this.getCurrentQuestionDetails();
		if (!details || this.currentQuestionAskerId !== String(this.player_id)) return;

		if (details.cardType === 2) {
			this.changeMainBar(`You asked everyone: ${details.text}`);
			return;
		}

		const target = this.currentQuestionTargetId
			? this.gamedatas!.players[this.currentQuestionTargetId as any]
			: null;
		const targetName = target?.name ?? _('another player');
		if (details.cardType === 3) {
			this.changeMainBar(`You asked ${targetName} in secret: ${details.text}`);
			return;
		}
		this.changeMainBar(`You asked ${targetName}: ${details.text}`);
	}

	showQuestionStatusForResponder() {
		const details = this.getCurrentQuestionDetails();
		if (!details || !this.isCurrentPlayerActive()) return;
		this.changeMainBar(`Answer the question: ${details.text}`);
	}

	updateCurrentQuestionDisplay() {
		if (this.currentState !== 'targetResponse') return;

		if (this.currentQuestionAskerId === String(this.player_id)) {
			this.showQuestionStatusForAsker();
			return;
		}

		if (this.isCurrentPlayerActive()) {
			this.showQuestionStatusForResponder();
		}
	}

	hideCurrentQuestion() {}

	showCardPreview(cardId: string) {
		const overlay = $('kk_card_preview_overlay') as HTMLElement | null;
		if (!overlay) return;
		const data = this.cardDataById[cardId];
		if (!data) return;
		const questions = (this.gamedatas as any).questions as Record<number, { description: string }>;
		const text = questions[parseInt(data.type_arg)]?.description ?? '';
		const cardType = parseInt(data.type);
		const typeIcons: Record<number, string> = { 1: '👤', 2: '👥', 3: '🤫' };
		const typeNames: Record<number, string> = { 1: 'Ask one player', 2: 'Ask all players', 3: 'Ask in secret' };
		const typeClassMap: Record<number, string> = { 1: 'kk_card_ask_one', 2: 'kk_card_ask_all', 3: 'kk_card_ask_secret' };
		const icon = typeIcons[cardType] ?? '👤';

		// Render an enlarged card graphic
		const cardEl = $('kk_preview_card');
		if (cardEl) {
			cardEl.className = `kk_preview_card ${typeClassMap[cardType] ?? 'kk_card_ask_one'}`;
			cardEl.innerHTML =
				`<div class="kk_card_type_icon kk_preview_card_icon">${icon}</div>` +
				`<div class="kk_card_content kk_preview_card_text">${text}</div>`;
		}

		const hintEl = $('kk_preview_hint');
		const typeName = typeNames[cardType] ?? '';
		if (hintEl) hintEl.innerHTML =
			`<strong>${icon} ${typeName}</strong><br>` +
			((cardType === 1 || cardType === 3) ? _('Select a player to ask') : _('This will ask all players'));

		overlay.style.display = 'flex';
	}

	hideCardPreview() {
		const overlay = $('kk_card_preview_overlay') as HTMLElement | null;
		if (overlay) overlay.style.display = 'none';
		this.clearCardPreviewActions();
	}

	clearCardPreviewActions() {
		const titleEl = $('kk_preview_actions_title') as HTMLElement | null;
		const actionsEl = $('kk_preview_actions') as HTMLElement | null;
		if (titleEl) titleEl.innerHTML = '';
		if (actionsEl) actionsEl.innerHTML = '';
	}

	getAskTargets() {
		return Object.entries(this.gamedatas!.players)
			.filter(([pid, player]) =>
				pid !== String(this.player_id) && (player as any).eliminated != 1
			)
			.map(([pid, player]) => ({ id: pid, name: player.name }));
	}

	addPreviewActionButton(
		container: HTMLElement,
		label: string,
		handler: () => void,
		colorClass: 'blue' | 'gray' = 'blue'
	) {
		const button = dojo.create('a', {
			className: `bgabutton bgabutton_${colorClass} kk_preview_action_button`,
			href: '#',
			innerHTML: label
		}, container) as HTMLAnchorElement;
		dojo.connect(button, 'onclick', (evt: MouseEvent) => {
			dojo.stopEvent(evt);
			handler();
		});
	}

	renderCardPreviewActions(cardId: string) {
		const titleEl = $('kk_preview_actions_title') as HTMLElement | null;
		const actionsEl = $('kk_preview_actions') as HTMLElement | null;
		if (!titleEl || !actionsEl) return;

		this.clearCardPreviewActions();

		const cardType = parseInt(this.cardDataById[cardId]?.type ?? '1');

		if (cardType === 1 || cardType === 3) {
			titleEl.innerHTML = _('Select a player to ask');
			for (const target of this.getAskTargets()) {
				this.addPreviewActionButton(
					actionsEl,
					target.name,
					() => this.playCardWithTarget(cardId, parseInt(target.id))
				);
			}
		} else {
			titleEl.innerHTML = _('Ask everyone this question?');
			this.addPreviewActionButton(
				actionsEl,
				_('Ask all'),
				() => this.playCardWithTarget(cardId, 0)
			);
		}

		this.addPreviewActionButton(actionsEl, _('Cancel'), () => this.playCardCancel(), 'gray');
	}

	showAskActions(cardId: string) {
		const cardType = parseInt(this.cardDataById[cardId]?.type ?? '1');

		this.removeActionButtons();
		this.renderCardPreviewActions(cardId);

		if (cardType === 1 || cardType === 3) {
			this.changeMainBar(_("Select a player to ask:"));
			for (const target of this.getAskTargets()) {
				this.addActionButton(
					`target_button_${target.id}`,
					_(target.name),
					() => this.playCardWithTarget(cardId, parseInt(target.id))
				);
			}
			this.addActionButton('cancel_button', _('Cancel'), 'playCardCancel', undefined, false, 'gray');
		} else {
			this.changeMainBar(_("Ask everyone this question?"));
			this.addActionButton('playCard_button', _('Ask all'), () => this.playCardWithTarget(cardId, 0));
			this.addActionButton('cancel_button', _('Cancel'), 'playCardCancel', undefined, false, 'gray');
		}
	}

	displayAnswerChip(cardId: number | string, playerId: number | string, answer: string) {
		const cardDiv = $('commonarea_item_' + cardId);
		if (!cardDiv) return;
		const playerInfo = this.gamedatas!.players[playerId as any];
		if (!playerInfo) return;

		const color = '#' + playerInfo.color;
		const key = String(cardId);
		if (!this.cardAnswers[key]) this.cardAnswers[key] = [];

		// Avoid duplicates
		if (this.cardAnswers[key].some(a => a.playerId === String(playerId))) return;
		this.cardAnswers[key].push({ playerId: String(playerId), answer, color });

		// Remove old chips container
		const oldContainer = cardDiv.querySelector('.kk_chips_container');
		if (oldContainer) oldContainer.remove();

		// Sort: yes first, then no; within each group sort by color
		const sorted = [...this.cardAnswers[key]].sort((a, b) => {
			if (a.answer !== b.answer) return a.answer === 'yes' ? -1 : 1;
			return a.color.localeCompare(b.color);
		});

		const chipHtml = (a: { playerId: string; answer: string; color: string }) => {
			const p = this.gamedatas!.players[a.playerId as any];
			const initial = p ? p.name.charAt(0).toUpperCase() : '?';
			const label = a.answer === 'yes' ? 'Y' : 'N';
			const cls = a.answer === 'yes' ? 'kk_chip_yes' : 'kk_chip_no';
			return `<div class="kk_answer_chip ${cls}" title="${p?.name ?? ''}: ${a.answer}" style="background:${a.color}"><span class="kk_chip_initial">${initial}</span><span class="kk_chip_label">${label}</span></div>`;
		};

		cardDiv.insertAdjacentHTML('beforeend',
			`<div class="kk_chips_container">${sorted.map(chipHtml).join('')}</div>`
		);
	}

	///////////////////////////////////////////////////
	//// Player actions
	///////////////////////////////////////////////////

	onPlayerHandSelectionChanged( evt: Event )
	{
		if (this.currentState !== 'playerTurnAsk' || !this.isCurrentPlayerActive()) {
			return;
		}

		const selection = this.playerHand.getSelectedItems();
		if (selection.length === 0) {
			// Deselected — reset buttons
			this.hideCardPreview();
			this.removeActionButtons();
			this.addActionButton( 'discard_button', _('Discard & Redraw'), 'onDiscardAndRedraw', undefined, false, 'gray' );
			return;
		}

		const item = selection[0];
		this.showCardPreview(item.id);
		this.showAskActions(String(item.id));
	}

	playCardWithTarget( cardId: number | string, targetId: number ) {
		const numericCardId = parseInt(String(cardId));
		this.currentQuestionCardId = String(numericCardId);
		this.currentQuestionTargetId = String(targetId);
		this.currentQuestionAskerId = String(this.player_id);
		this.hideCardPreview();
		this.removeActionButtons();
		this.showQuestionStatusForAsker();
		this.bgaPerformAction( 'actPlayCard', { card_id: numericCardId, target_id: targetId } );
		this.playerHand.removeFromStockById(numericCardId);
	}

	playCardCancel( evt?: Event ) {
		this.playerHand.unselectAll();
		this.hideCardPreview();
		this.removeActionButtons();
		this.addActionButton( 'discard_button', _('Discard & Redraw'), 'onDiscardAndRedraw', undefined, false, 'gray' );
	}

	onDiscardAndRedraw( evt: Event ) {
		this.bgaPerformAction( 'actDiscardAndRedraw', {} );
	}

	promptResponse() {
		const questions = (this.gamedatas as any).questions as Record<number, { description: string; code: string }>;
		const idtribe = this.gamedatas!['idtribe'] as any;
		const idnumber = this.gamedatas!['idnumber'] as any;
		const tribeCard = Object.values(idtribe ?? {})[0] as any;
		const numberCard = Object.values(idnumber ?? {})[0] as any;

		let expectedAnswer: string | null = null;

		if (tribeCard && numberCard && this.currentQuestionCardId) {
			const cardData = this.cardDataById[this.currentQuestionCardId];
			if (cardData) {
				const typeArg = parseInt(cardData.type_arg);
				const question = questions[typeArg];
				if (question?.code) {
					const number = parseInt(numberCard.type_arg); // 1–10
					const tribe = tribeCard.type as string; // 'knight' or 'knave'
					// code[10 - N] = '1' → yes is correct for number N
					const truthIsYes = question.code[10 - number] === '1';
					expectedAnswer = (tribe === 'knight') ? (truthIsYes ? 'yes' : 'no') : (truthIsYes ? 'no' : 'yes');
				}
			}
		}

		const tribe = tribeCard?.type ?? 'knight';
		const wrongHandler = () => {
			this.showMessage(_(`That's not correct! As a ${tribe}, you must answer ${expectedAnswer}.`), 'error');
		};
		this.showQuestionStatusForResponder();

		if (expectedAnswer === 'yes') {
			this.addActionButton('yes_button', _('Yes ✓'), 'yesResponse');
			this.addActionButton('no_button', _('No'), wrongHandler, undefined, false, 'red');
		} else if (expectedAnswer === 'no') {
			this.addActionButton('yes_button', _('Yes'), wrongHandler, undefined, false, 'red');
			this.addActionButton('no_button', _('No ✓'), 'noResponse');
		} else {
			// Fallback: both enabled (server validates)
			this.addActionButton('yes_button', _('Yes'), 'yesResponse');
			this.addActionButton('no_button', _('No'), 'noResponse');
		}
	}

	yesResponse( evt?: Event ) {
		this.bgaPerformAction( 'actGiveAnswer', { response: 'yes' } );
	}

	noResponse( evt?: Event ) {
		this.bgaPerformAction( 'actGiveAnswer', { response: 'no' } );
	}

	promptGuessOrPass() {
		this.addActionButton( 'guess_button', _('Guess'), 'playGuessTarget' );
		this.addActionButton( 'pass_button', _('Pass'), 'playerPass', undefined, false, 'gray' );
	}

	playGuessTarget( evt: Event ) {
		this.removeActionButtons();
		this.changeMainBar(_("Whose identity do you want to guess?"));
		for (const player_id in this.gamedatas!.players) {
			if (player_id == String(this.player_id)) continue;
			const playerInfo = this.gamedatas!.players[player_id as any]!;
			if ((playerInfo as any).eliminated == 1) continue;
			this.addActionButton(
				`guess_button_${player_id}`,
				_(playerInfo.name),
				() => this.playGuessTribe(player_id, playerInfo.name)
			);
		}
		this.addActionButton( 'cancel_guess', _('Cancel'), () => {
			this.removeActionButtons();
			this.promptGuessOrPass();
		}, undefined, false, 'gray' );
	}

	playGuessTribe( playerId: string, playerName: string ) {
		this.removeActionButtons();
		this.changeMainBar(`Is ${playerName} a Knight or a Knave?`);
		this.addActionButton( 'guess_button_knight', _('Knight'), () => this.playGuessNumber(playerId, playerName, 'knight') );
		this.addActionButton( 'guess_button_knave', _('Knave'), () => this.playGuessNumber(playerId, playerName, 'knave') );
		this.addActionButton( 'cancel_guess', _('Cancel'), 'playGuessTarget', undefined, false, 'gray' );
	}

	playGuessNumber( playerId: string, playerName: string, tribe: string ) {
		this.removeActionButtons();
		this.changeMainBar(`What is ${playerName}'s number?`);
		for (let num = 1; num <= 10; num++) {
			const numCopy = num;
			this.addActionButton( `guess_button_${num}`, _(numCopy.toString()), () => this.finalizeGuess(playerId, playerName, tribe, numCopy) );
		}
		this.addActionButton( 'cancel_guess', _('Cancel'), () => this.playGuessTribe(playerId, playerName), undefined, false, 'gray' );
	}

	finalizeGuess( playerId: string, playerName: string, tribe: string, num: number ) {
		this.removeActionButtons();
		this.changeMainBar(`Guess: ${playerName} is a ${tribe} with number ${num}`);
		this.addActionButton( 'confirm_button', _('Confirm Guess'), () => this.confirmGuess(playerId, tribe, num) );
		this.addActionButton( 'cancel_button', _('Cancel'), 'playGuessTarget', undefined, false, 'gray' );
	}

	confirmGuess( playerId: string, tribe: string, num: number ) {
		this.bgaPerformAction( 'actGuess', { target_id: playerId, tribe: tribe, number: num } );
	}

	playerPass( evt: Event ) {
		this.bgaPerformAction( 'actPass', {} );
	}

	///////////////////////////////////////////////////
	//// Notification handlers
	///////////////////////////////////////////////////

	override setupNotifications = () =>
	{
		console.log( 'notifications subscriptions setup' );

		dojo.subscribe( 'actPlayCard', this, "ntf_actCardPlayed" );
		dojo.subscribe( 'actGiveAnswer', this, "ntf_actGiveAnswer" );
		dojo.subscribe( 'actPass', this, "ntf_actPass" );
		dojo.subscribe( 'guessCorrect', this, "ntf_guessResult" );
		dojo.subscribe( 'guessIncorrect', this, "ntf_guessResult" );
		dojo.subscribe( 'playerEliminated', this, "ntf_playerEliminated" );
		dojo.subscribe( 'newScores', this, "ntf_newScores" );
		dojo.subscribe( 'cardsDrawn', this, "ntf_cardsDrawn" );
		dojo.subscribe( 'newHand', this, "ntf_newHand" );
		dojo.subscribe( 'actDiscardAndRedraw', this, "ntf_discardAndRedraw" );
		dojo.subscribe( 'secretQuestion', this, "ntf_secretQuestion" );
	}

	ntf_actCardPlayed( notif: any )
	{
		console.log( 'ntf_actCardPlayed', notif );
		const cardId = String(notif.args.card_id);
		const cardType = parseInt(notif.args.card_type);
		const isAsker = String(notif.args.player_id) === String(this.player_id);

		// For secret cards, the asker already has the correct type_arg from their hand.
		// Non-participants receive card_type_arg = -1 from the server, so we only update
		// cardDataById for non-askers (target gets the real data via ntf_secretQuestion).
		if (!isAsker || cardType !== 3) {
			this.cardDataById[cardId] = { type: notif.args.card_type, type_arg: notif.args.card_type_arg };
		}
		this.currentQuestionCardId = cardId;
		this.currentQuestionTargetId = notif.args.target_id ? String(notif.args.target_id) : null;
		this.currentQuestionAskerId = String(notif.args.player_id);

		// Track secret card target
		if (cardType === 3 && notif.args.target_id) {
			this.secretCardTargets[cardId] = parseInt(notif.args.target_id);
		}

		this.commonArea.addToStockWithId(0, notif.args.card_id);

		// For secret cards, hide question from non-participants
		if (cardType === 3) {
			const isAsker = String(notif.args.player_id) === String(this.player_id);
			const isTarget = String(notif.args.target_id) === String(this.player_id);
			if (!isAsker && !isTarget) {
				const cardEl = $('commonarea_item_' + cardId);
				if (cardEl) dojo.addClass(cardEl, 'kk_secret_hidden');
			}
		}

		this.playerHand.removeFromStockById(notif.args.card_id);
		this.hideCardPreview();

		if (this.currentState === 'targetResponse') {
			this.updateCurrentQuestionDisplay();
		}
	}

	ntf_actGiveAnswer( notif: any )
	{
		console.log( 'ntf_actGiveAnswer', notif );
		this.displayAnswerChip(notif.args.card_id, notif.args.player_id, notif.args.response);
	}

	ntf_actPass( notif: any )
	{
		console.log( 'ntf_actPass', notif );
	}

	ntf_guessResult( notif: any )
	{
		console.log( 'ntf_guessResult', notif );
		const isCorrect = notif.type === 'guessCorrect';
		const tribe = notif.args.tribe;
		const num = notif.args.number;

		if (isCorrect) {
			this.showMessage(
				`🎉 ${notif.args.player_name} correctly guessed! ${notif.args.target_name} is a ${tribe} with number ${num} and is eliminated!`,
				'info'
			);
			if (this.gamedatas!.players[notif.args.target_id]) {
				(this.gamedatas!.players[notif.args.target_id] as any).eliminated = 1;
			}
		} else {
			this.showMessage(
				`😓 ${notif.args.player_name} guessed wrong! ${notif.args.target_name} is NOT a ${tribe} with number ${num}. ${notif.args.player_name} is eliminated!`,
				'error'
			);
			if (this.gamedatas!.players[notif.args.player_id]) {
				(this.gamedatas!.players[notif.args.player_id] as any).eliminated = 1;
			}
		}
	}

	override ntf_playerEliminated( notif: any )
	{
		console.log( 'ntf_playerEliminated', notif );
		const eliminatedId = notif.args.who_quits;
		dojo.addClass('overall_player_board_' + eliminatedId, 'kk_eliminated');
		// Update local game data
		if (this.gamedatas!.players[eliminatedId]) {
			(this.gamedatas!.players[eliminatedId] as any).eliminated = 1;
		}
	}

	ntf_newScores( notif: any )
	{
		console.log( 'ntf_newScores', notif );
		for (const pid in notif.args.newScores) {
			(this.scoreCtrl as any)[pid]?.toValue(notif.args.newScores[pid]);
			const trophyDiv = $('trophy_count_' + pid);
			if (trophyDiv) trophyDiv.innerHTML = notif.args.newScores[pid];
		}
	}

	ntf_cardsDrawn( notif: any )
	{
		console.log( 'ntf_cardsDrawn', notif );
		for (const card of notif.args.cards) {
			this.cardDataById[card.id] = { type: card.type, type_arg: card.type_arg };
			this.playerHand.addToStockWithId(0, card.id);
		}
	}

	ntf_newHand( notif: any )
	{
		console.log( 'ntf_newHand', notif );
		// Replace entire hand (after discard & redraw)
		this.playerHand.removeAll();
		for (const card of notif.args.cards) {
			this.cardDataById[card.id] = { type: card.type, type_arg: card.type_arg };
			this.playerHand.addToStockWithId(0, card.id);
		}
	}

	ntf_discardAndRedraw( notif: any )
	{
		console.log( 'ntf_discardAndRedraw', notif );
		// If this is our discard, the newHand notification handles the hand update
	}

	ntf_secretQuestion( notif: any )
	{
		console.log( 'ntf_secretQuestion', notif );
		const cardId = String(notif.args.card_id);
		const questions = (this.gamedatas as any).questions as Record<number, { description: string }>;
		const text = questions[parseInt(notif.args.card_type_arg)]?.description ?? '';

		// Update card data with actual question
		if (this.cardDataById[cardId]) {
			this.cardDataById[cardId].type_arg = String(notif.args.card_type_arg);
		}
		this.currentQuestionCardId = cardId;

		// Reveal the question on the card
		const cardEl = $('commonarea_item_' + cardId);
		if (cardEl) {
			dojo.removeClass(cardEl, 'kk_secret_hidden');
			const contentEl = cardEl.querySelector('.kk_card_content') as HTMLElement | null;
			if (contentEl) contentEl.innerHTML = text;
		}

		this.updateCurrentQuestionDisplay();
	}
}

window.bgagame = { knightsandknaves: KnightsAndKnaves };
