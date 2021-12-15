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
    } else if (this.props.flagType === FlagTypes.flag) {
      return '🚩';
    } else if (this.props.flagType === FlagTypes.questionMark) {
      return '❔';
    }
  }

  onClick() {
    if (
      (
        this.props.gameState !== GameStates.notStarted
        && this.props.gameState !== GameStates.inProgress
      )
      || this.props.flagType !== FlagTypes.none
    ) return;

    this.props.onReveal(this.props.index);
  }

  onAuxClick() {
    if (
      this.props.gameState !== GameStates.inProgress
      || this.props.isRevealed
    ) return;

    this.props.onFlag(this.props.index);
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
  flagType: PropTypes.oneOf(Object.values(FlagTypes)).isRequired,
  isRevealed: PropTypes.bool.isRequired,
  isMine: PropTypes.bool.isRequired,
  adjacentMines: PropTypes.number.isRequired,
  gameState: PropTypes.oneOf(Object.values(GameStates)).isRequired,
  onReveal: PropTypes.func.isRequired,
  onFlag: PropTypes.func.isRequired
};

Square.defaultProps = {
  flagType: FlagTypes.none,
  isRevealed: false,
  isMine: false,
  adjacentMines: 0
};

class Minesweeper extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      board: this.generatePlaceholderBoard(),
      gameState: GameStates.notStarted
    };

    this.startNewGame = this.startNewGame.bind(this);
    this.onReveal = this.onReveal.bind(this);
    this.onFlag = this.onFlag.bind(this);
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

  generatePlaceholderBoard() {
    return new Array(this.props.width * this.props.height).fill({});
  }

  generateBoard(firstIndex) {
    const board = [];

    const mineLocations = new Set();
    const startNeighbors = this.getNeighbors(firstIndex);

    while (mineLocations.size < this.props.mines) {
      // The first clicked square should not be a mine or have any adjacent mines
      const location = getRandomInt(0, this.props.height * this.props.width);
      if (
        location !== firstIndex
        && !startNeighbors.includes(location)
      ) {
        mineLocations.add(location);
      }
    }

    for (let index = 0; index < this.props.height * this.props.width; index++) {
      const adjacentMines = this.getNeighbors(index).reduce((count, neighbor) => {
        if (mineLocations.has(neighbor)) count++;
        return count;
      }, 0);

      board.push({
        isMine: mineLocations.has(index),
        adjacentMines
      });
    }

    return board;
  }

  startNewGame() {
    this.setState({
      board: this.generatePlaceholderBoard(),
      gameState: GameStates.notStarted
    });
  }

  onReveal(index) {
    /* TODO: detect win state (all non-mine squares revealed) */
    this.setState(state => {
      if (state.gameState === GameStates.notStarted) {
        state.board = this.generateBoard(index);
        state.gameState = GameStates.inProgress;
      }

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

  onFlag(index) {
    const flagType = this.state.board[index].flagType;

    this.setState(state => {
      switch (flagType) {
        case FlagTypes.none:
        default:
          state.board[index].flagType = FlagTypes.flag;
          break;
        case FlagTypes.flag:
          state.board[index].flagType = FlagTypes.questionMark;
          break;
        case FlagTypes.questionMark:
          state.board[index].flagType = FlagTypes.none;
          break;
      }

      return {
        board: state.board
      };
    });
  }

  render() {
    const boardStyle = {
      '--board-height': this.props.height,
      '--board-width': this.props.width
    };

    return (
      <div className="game">
        <div className="header">
          {/* TODO: hook up counters */}
          <div className="counter mines">010</div>
          <div className="start-button" onClick={this.startNewGame}>
            <span role="img" aria-label="Smiley Face">🙂</span>
          </div>
          <div className="counter timer">001</div>
        </div>
        <div className="board" style={boardStyle}>
          {this.state.board.map((props, index) =>
            <Square
              index={index}
              key={index}
              gameState={this.state.gameState}
              onReveal={this.onReveal}
              onFlag={this.onFlag}
              {...props}
            />
          )}
        </div>
      </div>
    );
  }
}

Minesweeper.propTypes = {
  height: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  mines: PropTypes.number.isRequired
};

function App() {
  return (
    <Minesweeper
      height={9}
      width={9}
      mines={10}
    />
  );
}

export default App;
