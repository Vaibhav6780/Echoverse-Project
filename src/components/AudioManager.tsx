
import * as THREE from 'three';

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private listener: THREE.AudioListener;
  private scene: THREE.Scene;
  private sounds: Map<string, THREE.Audio> = new Map();
  private positionalSounds: Map<string, THREE.PositionalAudio> = new Map();
  private synthesis: SpeechSynthesis;
  private backgroundMusic: THREE.Audio | null = null;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.listener = new THREE.AudioListener();
    this.scene = new THREE.Scene();
    this.initializeAudioContext();
    this.createDefaultSounds();
  }

  private async initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Handle audio context suspension in some browsers
      if (this.audioContext.state === 'suspended') {
        document.addEventListener('click', async () => {
          if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
          }
        }, { once: true });
      }
    } catch (error) {
      console.error('Error initializing audio context:', error);
    }
  }

  private createDefaultSounds() {
    // Create procedural sounds for the game
    this.createSound('step', this.generateStepSound());
    this.createSound('success', this.generateSuccessSound());
    this.createSound('danger', this.generateDangerSound());
    this.createSound('pickup', this.generatePickupSound());
    this.createSound('echo', this.generateEchoSound());
    this.createSound('ambient', this.generateAmbientSound());
  }

  private generateStepSound(): AudioBuffer {
    if (!this.audioContext) return new AudioBuffer({ length: 1, sampleRate: 44100 });
    
    const length = this.audioContext.sampleRate * 0.1; // 0.1 second
    const buffer = this.audioContext.createBuffer(1, length, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < length; i++) {
      const t = i / this.audioContext.sampleRate;
      data[i] = Math.random() * 0.3 * Math.exp(-t * 10) * Math.sin(t * 100);
    }
    
    return buffer;
  }

  private generateSuccessSound(): AudioBuffer {
    if (!this.audioContext) return new AudioBuffer({ length: 1, sampleRate: 44100 });
    
    const length = this.audioContext.sampleRate * 0.5;
    const buffer = this.audioContext.createBuffer(1, length, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < length; i++) {
      const t = i / this.audioContext.sampleRate;
      data[i] = 0.3 * Math.sin(t * 440 * Math.PI * 2) * Math.exp(-t * 2) +
                0.2 * Math.sin(t * 660 * Math.PI * 2) * Math.exp(-t * 3) +
                0.1 * Math.sin(t * 880 * Math.PI * 2) * Math.exp(-t * 4);
    }
    
    return buffer;
  }

  private generateDangerSound(): AudioBuffer {
    if (!this.audioContext) return new AudioBuffer({ length: 1, sampleRate: 44100 });
    
    const length = this.audioContext.sampleRate * 0.8;
    const buffer = this.audioContext.createBuffer(1, length, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < length; i++) {
      const t = i / this.audioContext.sampleRate;
      const frequency = 200 + Math.sin(t * 10) * 50;
      data[i] = 0.4 * Math.sin(t * frequency * Math.PI * 2) * 
                (Math.sin(t * 8) > 0 ? 1 : 0) * Math.exp(-t * 0.5);
    }
    
    return buffer;
  }

  private generatePickupSound(): AudioBuffer {
    if (!this.audioContext) return new AudioBuffer({ length: 1, sampleRate: 44100 });
    
    const length = this.audioContext.sampleRate * 0.3;
    const buffer = this.audioContext.createBuffer(1, length, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < length; i++) {
      const t = i / this.audioContext.sampleRate;
      const frequency = 800 + t * 400;
      data[i] = 0.2 * Math.sin(t * frequency * Math.PI * 2) * Math.exp(-t * 3);
    }
    
    return buffer;
  }

  private generateEchoSound(): AudioBuffer {
    if (!this.audioContext) return new AudioBuffer({ length: 1, sampleRate: 44100 });
    
    const length = this.audioContext.sampleRate * 2;
    const buffer = this.audioContext.createBuffer(1, length, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < length; i++) {
      const t = i / this.audioContext.sampleRate;
      data[i] = 0.1 * Math.sin(t * 300 * Math.PI * 2) * Math.exp(-t * 1) +
                0.05 * Math.sin(t * 300 * Math.PI * 2) * Math.exp(-(t - 0.3) * 1) * (t > 0.3 ? 1 : 0) +
                0.025 * Math.sin(t * 300 * Math.PI * 2) * Math.exp(-(t - 0.6) * 1) * (t > 0.6 ? 1 : 0);
    }
    
    return buffer;
  }

  private generateAmbientSound(): AudioBuffer {
    if (!this.audioContext) return new AudioBuffer({ length: 1, sampleRate: 44100 });
    
    const length = this.audioContext.sampleRate * 4;
    const buffer = this.audioContext.createBuffer(1, length, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < length; i++) {
      const t = i / this.audioContext.sampleRate;
      data[i] = 0.1 * (Math.random() - 0.5) * Math.sin(t * 0.5) +
                0.05 * Math.sin(t * 80 * Math.PI * 2) * Math.sin(t * 0.3) +
                0.03 * Math.sin(t * 120 * Math.PI * 2) * Math.sin(t * 0.7);
    }
    
    return buffer;
  }

  private createSound(name: string, buffer: AudioBuffer) {
    const sound = new THREE.Audio(this.listener);
    sound.setBuffer(buffer);
    this.sounds.set(name, sound);
  }

  public playSound(name: string, volume: number = 1) {
    const sound = this.sounds.get(name);
    if (sound) {
      sound.setVolume(volume);
      if (sound.isPlaying) {
        sound.stop();
      }
      sound.play();
    }
  }

  public createPositionalSound(name: string, position: THREE.Vector3, buffer?: AudioBuffer) {
    const positionalAudio = new THREE.PositionalAudio(this.listener);
    
    if (buffer) {
      positionalAudio.setBuffer(buffer);
    } else {
      // Use a default buffer
      const defaultBuffer = this.sounds.get('echo')?.buffer;
      if (defaultBuffer) {
        positionalAudio.setBuffer(defaultBuffer);
      }
    }
    
    positionalAudio.setRefDistance(1);
    positionalAudio.setRolloffFactor(1);
    positionalAudio.setDistanceModel('exponential');
    
    // Create a mesh to hold the audio
    const geometry = new THREE.SphereGeometry(0.1);
    const material = new THREE.MeshBasicMaterial({ visible: false });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.add(positionalAudio);
    
    this.scene.add(mesh);
    this.positionalSounds.set(name, positionalAudio);
    
    return positionalAudio;
  }

  public playPositionalSound(name: string, volume: number = 1) {
    const sound = this.positionalSounds.get(name);
    if (sound) {
      sound.setVolume(volume);
      if (sound.isPlaying) {
        sound.stop();
      }
      sound.play();
    }
  }

  public setListenerPosition(position: THREE.Vector3, forward: THREE.Vector3, up: THREE.Vector3) {
    this.listener.position.copy(position);
    this.listener.setRotationFromMatrix(
      new THREE.Matrix4().lookAt(position, position.clone().add(forward), up)
    );
  }

  public speak(text: string, options: { interrupt?: boolean; rate?: number; pitch?: number } = {}) {
    if (options.interrupt) {
      this.synthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || 0.9;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = 0.8;
    
    // Use a clear voice if available
    const voices = this.synthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Natural') || 
      voice.name.includes('Enhanced') ||
      voice.lang.startsWith('en')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    this.synthesis.speak(utterance);
  }

  public startBackgroundMusic() {
    if (!this.backgroundMusic) {
      this.backgroundMusic = new THREE.Audio(this.listener);
      const buffer = this.sounds.get('ambient')?.buffer;
      if (buffer) {
        this.backgroundMusic.setBuffer(buffer);
        this.backgroundMusic.setLoop(true);
        this.backgroundMusic.setVolume(0.3);
      }
    }
    
    if (this.backgroundMusic && !this.backgroundMusic.isPlaying) {
      this.backgroundMusic.play();
    }
  }

  public stopBackgroundMusic() {
    if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
      this.backgroundMusic.stop();
    }
  }

  public cleanup() {
    this.synthesis.cancel();
    this.sounds.forEach(sound => {
      if (sound.isPlaying) {
        sound.stop();
      }
    });
    this.positionalSounds.forEach(sound => {
      if (sound.isPlaying) {
        sound.stop();
      }
    });
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
