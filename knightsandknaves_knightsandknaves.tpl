{OVERALL_GAME_HEADER}

<!-- 
--------
-- BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
-- KnightsAndKnaves implementation : © <Your name here> <Your email address here>
-- 
-- This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
-- See http://en.boardgamearena.com/#!doc/Studio for more information.
-------

    knightsandknaves_knightsandknaves.tpl
    
    This is the HTML template of your game.
    
    Everything you are writing in this file will be displayed in the HTML page of your game user interface,
    in the "main game zone" of the screen.
    
    You can use in this template:
    _ variables, with the format {MY_VARIABLE_ELEMENT}.
    _ HTML block, with the BEGIN/END format
    
    See your "view" PHP file to check how to set variables and control blocks
    
    Please REMOVE this comment before publishing your game on BGA
-->



<div id="commonarea_wrap" class="whiteblock">
<h3>Played Cards</h3>
<div class="tablecards" id="commonarea">
</div>
</div>


<div id="mynotes_wrap" class="whiteblock">
  <h3>Note Card</h3>
  <div id="mynotes">
  <!-- BEGIN notecard -->
        <h4>{PLAYER_NAME}</h4>
        <table class="number-table">
        <tr>
            <th>knight</th>
            <td onclick="toggleScratch(this)">1</td>
            <td onclick="toggleScratch(this)">2</td>
            <td onclick="toggleScratch(this)">3</td>
            <td onclick="toggleScratch(this)">4</td>
            <td onclick="toggleScratch(this)">5</td>
            <td onclick="toggleScratch(this)">6</td>
            <td onclick="toggleScratch(this)">7</td>
            <td onclick="toggleScratch(this)">8</td>
            <td onclick="toggleScratch(this)">9</td>
            <td onclick="toggleScratch(this)">10</td>
        </tr>
        <tr>
            <th>knave</th>
            <td onclick="toggleScratch(this)">1</td>
            <td onclick="toggleScratch(this)">2</td>
            <td onclick="toggleScratch(this)">3</td>
            <td onclick="toggleScratch(this)">4</td>
            <td onclick="toggleScratch(this)">5</td>
            <td onclick="toggleScratch(this)">6</td>
            <td onclick="toggleScratch(this)">7</td>
            <td onclick="toggleScratch(this)">8</td>
            <td onclick="toggleScratch(this)">9</td>
            <td onclick="toggleScratch(this)">10</td>
        </tr>
    </table>
  <!-- END notecard -->
  </div>
</div>



<div id="myhand_wrap" class="whiteblock">
    <h3>{MY_HAND}</h3>
    <div id="myhand">
    </div>
    <div id="myNumber">
    </div>
</div>

<script type="text/javascript">

// Javascript HTML templates
// Javascript HTML templates

var jstpl_cardontable = '<div class="cardontable" id="cardontable_${player_id}" style="background-position:-${x}px -${y}px">\
                        </div>';

/*
// Example:
var jstpl_some_game_item='<div class="my_game_item" id="my_game_item_${MY_ITEM_ID}"></div>';

*/

</script>  

{OVERALL_GAME_FOOTER}
