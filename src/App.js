import React from 'react';
import PropTypes from 'prop-types';
import './App.css';

const GameStates = {
  notStarted: 'notStarted',
  inProgress: 'inProgress',
  win: 'win',
  loss: 'loss'
};

const FlagTypes = {
  none: 'none',
  flag: 'flag',
  questionMark: 'questionMark'
};

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

class Square extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      flagType: FlagTypes.none
    };

    this.onClick = this.onClick.bind(this);
    this.onAuxClick = this.onAuxClick.bind(this);
  }

  content() {
    if (this.props.isMine && this.props.isRevealed) {
      return '💥';
    } else if (this.props.isMine && this.props.gameState === GameStates.loss) {
      return '💣';
    } else if (this.props.isRevealed && this.props.adjacentMines > 0) {
      return this.props.adjacentMines;
    } else if (this.state.flagType === FlagTypes.flag) {
      return '🚩';
    } else if (this.state.flagType === FlagTypes.questionMark) {
      return '❔';
    }
  }

  onClick() {
    if (
      this.props.gameState !== GameStates.inProgress
      || this.state.flagType !== FlagTypes.none
    ) return;

    this.props.onReveal(this.props.index);
  }

  onAuxClick() {
    if (
      this.props.gameState !== GameStates.inProgress
      || this.props.isRevealed
    ) return;

    this.setState(state => {
      switch (state.flagType) {
        case FlagTypes.none:
          return { flagType: FlagTypes.flag };
        case FlagTypes.flag:
          return { flagType: FlagTypes.questionMark };
        case FlagTypes.questionMark:
          return { flagType: FlagTypes.none };
        default:
          return {};
      }
    });
  }

  render() {
    const classes = ['square'];
    if (this.props.isRevealed) classes.push('revealed');

    return (
      <div
        className={classes.join(' ')}
        data-adjacent-mines={this.props.adjacentMines}
        onClick={this.onClick}
        onAuxClick={this.onAuxClick}
        onContextMenu={e => e.preventDefault()}
      >
        <span>{this.content()}</span>
      </div>
    );
  }
}

Square.propTypes = {
  index: PropTypes.number.isRequired,
  isMine: PropTypes.bool.isRequired,
  isRevealed: PropTypes.bool.isRequired,
  adjacentMines: PropTypes.number.isRequired,
  gameState: PropTypes.oneOf(Object.values(GameStates)).isRequired,
  onReveal: PropTypes.func.isRequired
};

class Board extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      board: this.generateBoard(),
      gameState: GameStates.inProgress
    };

    this.onReveal = this.onReveal.bind(this);
  }

  getNeighbors(index) {
    return [
      index - this.props.width - 1,
      index - this.props.width,
      index - this.props.width + 1,
      index - 1,
      index + 1,
      index + this.props.width - 1,
      index + this.props.width,
      index + this.props.width + 1
    ].filter(neighbor => {
      return (
        neighbor >= 0
        && neighbor < (this.props.width * this.props.height)
        && Math.abs((neighbor % this.props.width) - (index % this.props.width)) <= 1
      );
    });
  }

  generateBoard() {
    const board = [];

    const mineLocations = new Set();
    while (mineLocations.size < this.props.mines) {
      mineLocations.add(getRandomInt(0, this.props.height * this.props.width));
    }

    for (let index = 0; index < this.props.height * this.props.width; index++) {
      const adjacentMines = this.getNeighbors(index).reduce((count, neighbor) => {
        if (mineLocations.has(neighbor)) count++;
        return count;
      }, 0);

      board.push({
        index,
        isMine: mineLocations.has(index),
        isRevealed: false,
        adjacentMines
      });
    }

    return board;
  }

  onReveal(index) {
    this.setState(state => {
      const revealSquare = index => {
        const square = state.board[index];
        if (square.isRevealed) return;

        square.isRevealed = true;

        if (square.isMine) {
          state.gameState = GameStates.loss;

        } else if (square.adjacentMines === 0) {
          this.getNeighbors(index).forEach(revealSquare);
        }
      };

      revealSquare(index);

      return {
        board: state.board,
        gameState: state.gameState
      };
    });
  }

  render() {
    const boardStyle = {
      '--board-height': this.props.height,
      '--board-width': this.props.width
    };

    return (
      <div className="board" style={boardStyle}>
        {this.state.board.map((props, index) =>
          <Square
            key={index}
            gameState={this.state.gameState}
            onReveal={this.onReveal}
            {...props}
          />
        )}
      </div>
    );
  }
}

Board.propTypes = {
  height: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  mines: PropTypes.number.isRequired
};

function App() {
  return (
    <Board
      height={9}
      width={9}
      mines={10}
    />
  );
}

export default App;
