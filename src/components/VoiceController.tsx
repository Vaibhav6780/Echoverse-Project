
import React from 'react';

interface VoiceControllerOptions {
  onCommand: (command: string) => void;
  onListeningChange: (listening: boolean) => void;
}

export class VoiceController {
  private recognition: any;
  private synthesis: SpeechSynthesis;
  private isListening: boolean = false;
  private onCommand: (command: string) => void;
  private onListeningChange: (listening: boolean) => void;
  private lastSpeech: string = '';

  constructor(options: VoiceControllerOptions) {
    this.onCommand = options.onCommand;
    this.onListeningChange = options.onListeningChange;
    this.synthesis = window.speechSynthesis;
    
    this.initializeSpeechRecognition();
    this.setupKeyboardListeners();
  }

  private initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
      
      this.recognition.onstart = () => {
        console.log('Speech recognition started');
        this.isListening = true;
        this.onListeningChange(true);
      };
      
      this.recognition.onend = () => {
        console.log('Speech recognition ended');
        this.isListening = false;
        this.onListeningChange(false);
      };
      
      this.recognition.onresult = (event: any) => {
        const last = event.results.length - 1;
        const command = event.results[last][0].transcript.toLowerCase().trim();
        console.log('Speech recognized:', command);
        this.processVoiceCommand(command);
      };
      
      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        this.isListening = false;
        this.onListeningChange(false);
      };
    } else {
      console.warn('Speech recognition not supported');
    }
  }

  private setupKeyboardListeners() {
    document.addEventListener('keydown', (event) => {
      // Prevent default for game keys
      const gameKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
      if (gameKeys.includes(event.code)) {
        event.preventDefault();
      }

      switch(event.code) {
        case 'KeyS':
          this.onCommand('start game');
          break;
        case 'KeyM':
          this.onCommand('toggle mode');
          break;
        case 'KeyV':
          this.onCommand('toggle voice');
          break;
        case 'KeyR':
          this.onCommand('reset game');
          break;
        case 'ArrowLeft':
          this.onCommand('go left');
          break;
        case 'ArrowRight':
          this.onCommand('go right');
          break;
        case 'ArrowUp':
          this.onCommand('go forward');
          break;
        case 'ArrowDown':
          this.onCommand('go back');
          break;
        case 'KeyH':
          this.onCommand('help');
          break;
        case 'Space':
          event.preventDefault();
          this.onCommand('look around');
          break;
      }
    });
  }

  private processVoiceCommand(command: string) {
    // Map common voice commands
    const commandMap: { [key: string]: string } = {
      'start': 'start game',
      'begin': 'start game',
      'play': 'start game',
      'left': 'go left',
      'right': 'go right',
      'forward': 'go forward',
      'ahead': 'go forward',
      'back': 'go back',
      'backward': 'go back',
      'behind': 'go back',
      'look': 'look around',
      'examine': 'look around',
      'check': 'look around',
      'help': 'help',
      'assist': 'help',
      'repeat': 'repeat',
      'again': 'repeat',
      'stop': 'stop game',
      'quit': 'stop game',
      'reset': 'reset game',
      'restart': 'reset game'
    };

    // Check for direct matches first
    if (commandMap[command]) {
      this.onCommand(commandMap[command]);
      return;
    }

    // Check for partial matches
    for (const [key, value] of Object.entries(commandMap)) {
      if (command.includes(key)) {
        this.onCommand(value);
        return;
      }
    }

    // Check for compound commands
    if (command.includes('go') || command.includes('move') || command.includes('walk')) {
      if (command.includes('left')) {
        this.onCommand('go left');
      } else if (command.includes('right')) {
        this.onCommand('go right');
      } else if (command.includes('forward') || command.includes('ahead')) {
        this.onCommand('go forward');
      } else if (command.includes('back') || command.includes('backward')) {
        this.onCommand('go back');
      }
      return;
    }

    // If no match found, pass the original command
    this.onCommand(command);
  }

  public startListening() {
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  public speak(text: string, options: { interrupt?: boolean } = {}) {
    if (options.interrupt) {
      this.synthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    // Use a clear, natural voice if available
    const voices = this.synthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Natural') || 
      voice.name.includes('Enhanced') ||
      voice.name.includes('Premium') ||
      voice.lang.startsWith('en')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    this.lastSpeech = text;
    this.synthesis.speak(utterance);
  }

  public repeatLastSpeech() {
    if (this.lastSpeech) {
      this.speak(this.lastSpeech, { interrupt: true });
    }
  }

  public cleanup() {
    if (this.recognition) {
      this.recognition.stop();
    }
    this.synthesis.cancel();
  }
}
