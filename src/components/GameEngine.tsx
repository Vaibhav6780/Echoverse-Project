import * as THREE from 'three';
import { AudioManager } from './AudioManager';
import { VoiceController } from './VoiceController';

interface GameEngineOptions {
  audioManager: AudioManager;
  voiceController: VoiceController;
  onStateChange: (state: any) => void;
  onLog: (message: string) => void;
  onVisualUpdate?: (visualData: any) => void;
}

interface GameState {
  mode: 'practice' | 'adventure';
  isPlaying: boolean;
  score: number;
  lives: number;
  currentLevel: number;
  playerPosition: THREE.Vector3;
  playerDirection: THREE.Vector3;
  environment: any;
  objectives: any[];
  inventory: string[];
}

export class GameEngine {
  private audioManager: AudioManager;
  private voiceController: VoiceController;
  private onStateChange: (state: any) => void;
  private onLog: (message: string) => void;
  private onVisualUpdate?: (visualData: any) => void;
  private gameState: GameState;
  private environments: any[] = [];
  private currentObjective: any = null;
  private lastCommand: string = '';

  constructor(options: GameEngineOptions) {
    this.audioManager = options.audioManager;
    this.voiceController = options.voiceController;
    this.onStateChange = options.onStateChange;
    this.onLog = options.onLog;
    this.onVisualUpdate = options.onVisualUpdate;
    
    this.gameState = {
      mode: 'practice',
      isPlaying: false,
      score: 0,
      lives: 3,
      currentLevel: 1,
      playerPosition: new THREE.Vector3(0, 0, 0),
      playerDirection: new THREE.Vector3(0, 0, 1),
      environment: null,
      objectives: [],
      inventory: []
    };

    this.initializeEnvironments();
  }

  private initializeEnvironments() {
    this.environments = [
      {
        id: 1,
        name: "The Echoing Forest",
        description: "You find yourself in a mysterious forest where sounds bounce off ancient trees. The ground crunches softly beneath your feet.",
        size: new THREE.Vector3(10, 0, 10),
        soundscape: "forest",
        objectives: [
          {
            type: "find",
            target: "crystal",
            position: new THREE.Vector3(3, 0, 4),
            description: "A magical crystal that hums with energy"
          }
        ],
        hazards: [
          {
            type: "pit",
            position: new THREE.Vector3(-2, 0, 2),
            description: "A deep pit with echoing depths"
          }
        ]
      },
      {
        id: 2,
        name: "The Whispering Caves",
        description: "Deep underground caverns where every sound creates haunting echoes. Water drips steadily in the distance.",
        size: new THREE.Vector3(8, 0, 12),
        soundscape: "cave",
        objectives: [
          {
            type: "escape",
            target: "exit",
            position: new THREE.Vector3(0, 0, 6),
            description: "The cave exit with fresh air flowing through"
          }
        ],
        hazards: [
          {
            type: "rockfall",
            position: new THREE.Vector3(2, 0, -3),
            description: "Unstable rocks that could fall"
          }
        ]
      }
    ];
  }

  public startGame(mode: 'practice' | 'adventure') {
    this.gameState.mode = mode;
    this.gameState.isPlaying = true;
    this.gameState.playerPosition.set(0, 0, 0);
    this.gameState.playerDirection.set(0, 0, 1);
    
    if (mode === 'practice') {
      this.startPracticeMode();
    } else {
      this.startAdventureMode();
    }
    
    this.updateState();
    this.updateVisualState();
    this.audioManager.startBackgroundMusic();
  }

  private startPracticeMode() {
    const welcomeMessage = `
      Welcome to Practice Mode! This is a safe space to learn the controls.
      You are standing in the center of a small room.
      Try saying "go left", "go right", "go forward", or "go back" to move around.
      Say "look around" to examine your surroundings.
      Say "help" if you need assistance.
    `;
    
    this.audioManager.speak(welcomeMessage);
    this.onLog("Started Practice Mode");
    
    // Create simple practice environment
    this.gameState.environment = {
      name: "Practice Room",
      description: "A simple room for learning",
      size: new THREE.Vector3(4, 0, 4)
    };
  }

  private startAdventureMode() {
    const environment = this.environments[this.gameState.currentLevel - 1];
    this.gameState.environment = environment;
    this.gameState.objectives = [...environment.objectives];
    this.currentObjective = this.gameState.objectives[0];
    
    const welcomeMessage = `
      Welcome to Adventure Mode! 
      ${environment.description}
      Your objective: ${this.currentObjective.description}
      Listen carefully to the sounds around you. Good luck!
    `;
    
    this.audioManager.speak(welcomeMessage);
    this.onLog(`Started Adventure Mode - ${environment.name}`);
    
    // Set up spatial audio for objectives and hazards
    this.setupSpatialAudio();
  }

  private updateVisualState() {
    if (this.onVisualUpdate) {
      this.onVisualUpdate({
        playerPosition: {
          x: this.gameState.playerPosition.x,
          z: this.gameState.playerPosition.z
        },
        environment: this.gameState.environment,
        objectives: this.gameState.objectives,
        hazards: this.gameState.environment?.hazards || []
      });
    }
  }

  private setupSpatialAudio() {
    if (!this.gameState.environment) return;
    
    // Create positional sounds for objectives
    this.gameState.objectives.forEach((objective, index) => {
      this.audioManager.createPositionalSound(
        `objective_${index}`,
        objective.position
      );
    });
    
    // Create positional sounds for hazards
    this.gameState.environment.hazards?.forEach((hazard: any, index: number) => {
      this.audioManager.createPositionalSound(
        `hazard_${index}`,
        hazard.position
      );
    });
  }

  public processCommand(command: string) {
    this.lastCommand = command;
    this.onLog(`Processing: ${command}`);
    
    if (!this.gameState.isPlaying && !['start game', 'help', 'toggle mode', 'reset game'].includes(command)) {
      this.audioManager.speak("Please start a game first.");
      return;
    }

    switch (command) {
      case 'start game':
        this.startGame(this.gameState.mode);
        break;
      case 'go left':
        this.movePlayer('left');
        break;
      case 'go right':
        this.movePlayer('right');
        break;
      case 'go forward':
        this.movePlayer('forward');
        break;
      case 'go back':
        this.movePlayer('back');
        break;
      case 'look around':
        this.lookAround();
        break;
      case 'help':
        this.provideHelp();
        break;
      case 'repeat':
        this.voiceController.repeatLastSpeech();
        break;
      case 'toggle mode':
        this.toggleMode();
        break;
      case 'reset game':
        this.resetGame();
        break;
      case 'stop game':
        this.stopGame();
        break;
      default:
        this.handleUnknownCommand(command);
        break;
    }
  }

  private movePlayer(direction: string) {
    if (!this.gameState.isPlaying) return;
    
    const moveDistance = 1;
    const oldPosition = this.gameState.playerPosition.clone();
    
    switch (direction) {
      case 'left':
        this.gameState.playerPosition.x -= moveDistance;
        break;
      case 'right':
        this.gameState.playerPosition.x += moveDistance;
        break;
      case 'forward':
        this.gameState.playerPosition.z += moveDistance;
        break;
      case 'back':
        this.gameState.playerPosition.z -= moveDistance;
        break;
    }
    
    // Check boundaries
    if (this.gameState.environment) {
      const size = this.gameState.environment.size;
      const halfSize = size.clone().multiplyScalar(0.5);
      
      if (Math.abs(this.gameState.playerPosition.x) > halfSize.x ||
          Math.abs(this.gameState.playerPosition.z) > halfSize.z) {
        // Hit boundary
        this.gameState.playerPosition.copy(oldPosition);
        this.audioManager.speak("You've reached the edge. You cannot go further in this direction.");
        this.audioManager.playSound('danger', 0.5);
        return;
      }
    }
    
    // Play movement sound
    this.audioManager.playSound('step', 0.7);
    
    // Update listener position for spatial audio
    this.audioManager.setListenerPosition(
      this.gameState.playerPosition,
      this.gameState.playerDirection,
      new THREE.Vector3(0, 1, 0)
    );
    
    // Check for interactions
    this.checkForInteractions();
    
    // Provide movement feedback
    const feedback = this.getMovementFeedback(direction);
    if (feedback) {
      this.audioManager.speak(feedback);
    }
    
    this.updateState();
    this.updateVisualState();
  }

  private getMovementFeedback(direction: string): string {
    const pos = this.gameState.playerPosition;
    const env = this.gameState.environment;
    
    if (!env) {
      return `You moved ${direction}. You are now at position ${Math.round(pos.x)}, ${Math.round(pos.z)}.`;
    }
    
    // Generate contextual feedback based on environment and position
    let feedback = `You moved ${direction}. `;
    
    // Add environmental cues
    if (env.soundscape === 'forest') {
      if (Math.abs(pos.x) > 3 || Math.abs(pos.z) > 3) {
        feedback += "The trees seem denser here. ";
      }
      feedback += "Leaves rustle in the wind around you.";
    } else if (env.soundscape === 'cave') {
      if (Math.abs(pos.x) > 2 || Math.abs(pos.z) > 4) {
        feedback += "Your footsteps echo more dramatically here. ";
      }
      feedback += "Water drips steadily somewhere in the darkness.";
    }
    
    return feedback;
  }

  private checkForInteractions() {
    const playerPos = this.gameState.playerPosition;
    const interactionDistance = 1.5;
    
    // Check objectives
    this.gameState.objectives.forEach((objective, index) => {
      const distance = playerPos.distanceTo(objective.position);
      if (distance <= interactionDistance) {
        this.interactWithObjective(objective, index);
      } else if (distance <= 3) {
        // Give proximity hint
        this.audioManager.playPositionalSound(`objective_${index}`, 0.3);
      }
    });
    
    // Check hazards
    this.gameState.environment?.hazards?.forEach((hazard: any, index: number) => {
      const distance = playerPos.distanceTo(hazard.position);
      if (distance <= interactionDistance) {
        this.interactWithHazard(hazard);
      } else if (distance <= 2) {
        // Give warning
        this.audioManager.playPositionalSound(`hazard_${index}`, 0.4);
      }
    });
  }

  private interactWithObjective(objective: any, index: number) {
    this.audioManager.playSound('success');
    this.audioManager.speak(`Congratulations! You found ${objective.description}!`);
    
    this.gameState.score += 100;
    this.gameState.objectives.splice(index, 1);
    
    if (this.gameState.objectives.length === 0) {
      this.completeLevel();
    } else {
      this.currentObjective = this.gameState.objectives[0];
    }
    
    this.onLog(`Found: ${objective.description}`);
    this.updateState();
  }

  private interactWithHazard(hazard: any) {
    this.audioManager.playSound('danger');
    this.audioManager.speak(`Oh no! You encountered ${hazard.description}. You lost a life!`);
    
    this.gameState.lives -= 1;
    
    if (this.gameState.lives <= 0) {
      this.gameOver();
    } else {
      // Reset player position
      this.gameState.playerPosition.set(0, 0, 0);
      this.audioManager.speak(`You have ${this.gameState.lives} lives remaining. You've been returned to the starting position.`);
    }
    
    this.onLog(`Hazard encountered: ${hazard.description}`);
    this.updateState();
  }

  private completeLevel() {
    this.audioManager.playSound('success');
    this.audioManager.speak(`Level ${this.gameState.currentLevel} completed! Well done!`);
    
    this.gameState.score += 500;
    this.gameState.currentLevel += 1;
    
    if (this.gameState.currentLevel <= this.environments.length) {
      // Start next level
      setTimeout(() => {
        this.startAdventureMode();
      }, 3000);
    } else {
      // Game completed
      this.gameWon();
    }
    
    this.updateState();
  }

  private gameOver() {
    this.audioManager.speak(`Game Over! Your final score was ${this.gameState.score}. Better luck next time!`);
    this.stopGame();
  }

  private gameWon() {
    this.audioManager.speak(`Congratulations! You've completed all levels! Your final score is ${this.gameState.score}. You are a true EchoVerse champion!`);
    this.stopGame();
  }

  private lookAround() {
    if (!this.gameState.isPlaying) return;
    
    let description = "You listen carefully to your surroundings. ";
    
    if (this.gameState.environment) {
      description += this.gameState.environment.description + " ";
      
      // Check for nearby objectives
      const nearbyObjectives = this.gameState.objectives.filter(obj => 
        this.gameState.playerPosition.distanceTo(obj.position) <= 4
      );
      
      if (nearbyObjectives.length > 0) {
        description += "You sense something important nearby. ";
        // Play spatial audio cue
        this.audioManager.playSound('echo', 0.5);
      }
    } else {
      description += "You are in a practice room. The walls seem close on all sides.";
    }
    
    this.audioManager.speak(description);
    this.onLog("Examined surroundings");
  }

  private provideHelp() {
    const helpMessage = `
      Available commands: 
      Say "go left", "go right", "go forward", or "go back" to move.
      Say "look around" to examine your surroundings.
      Say "repeat" to hear the last message again.
      You can also use arrow keys for movement and spacebar to look around.
      Your current position is ${Math.round(this.gameState.playerPosition.x)}, ${Math.round(this.gameState.playerPosition.z)}.
    `;
    
    this.audioManager.speak(helpMessage);
    this.onLog("Provided help information");
  }

  private toggleMode() {
    if (this.gameState.isPlaying) {
      this.audioManager.speak("Please stop the current game before changing modes.");
      return;
    }
    
    this.gameState.mode = this.gameState.mode === 'practice' ? 'adventure' : 'practice';
    this.audioManager.speak(`Switched to ${this.gameState.mode} mode.`);
    this.updateState();
  }

  private handleUnknownCommand(command: string) {
    const unknownMessage = `I didn't understand "${command}". Say "help" for available commands.`;
    this.audioManager.speak(unknownMessage);
    this.onLog(`Unknown command: ${command}`);
  }

  private stopGame() {
    this.gameState.isPlaying = false;
    this.audioManager.stopBackgroundMusic();
    this.updateState();
  }

  public resetGame() {
    this.gameState = {
      mode: this.gameState.mode,
      isPlaying: false,
      score: 0,
      lives: 3,
      currentLevel: 1,
      playerPosition: new THREE.Vector3(0, 0, 0),
      playerDirection: new THREE.Vector3(0, 0, 1),
      environment: null,
      objectives: [],
      inventory: []
    };
    
    this.audioManager.stopBackgroundMusic();
    this.audioManager.speak("Game reset. Ready for a new adventure!");
    this.onLog("Game reset");
    this.updateState();
    this.updateVisualState();
  }

  private updateState() {
    this.onStateChange({
      mode: this.gameState.mode,
      isPlaying: this.gameState.isPlaying,
      score: this.gameState.score,
      lives: this.gameState.lives,
      currentLevel: this.gameState.currentLevel
    });
  }

  public cleanup() {
    this.audioManager.cleanup();
  }
}
