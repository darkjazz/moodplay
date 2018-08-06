import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';
import { DymoPlayer } from 'dymo-player';
import { DymoGenerator, DymoTemplates, SuperDymoStore, globals } from 'dymo-core';
import { MixGenerator } from './mix-generator';
import { FeatureExtractor, Transition, TransitionType, DecisionType } from './types';
import { Analyzer } from './analyzer';

export class AutoDj {

  private store: SuperDymoStore;
  private analyzer: Analyzer;
  private dymoGen: DymoGenerator;
  private mixGen: MixGenerator;
  private player: DymoPlayer;
  private previousPlayingDymos = [];
  private previousSongs = [];
  private isPlaying;

  //TODO AT SOME POINT IN THE FUTURE WE MAY HAVE AN API WITH SOME FEATURES
  constructor(private featureApi: string, private featureExtractor: FeatureExtractor) {
    this.player = new DymoPlayer(true, false, 1, 3);
  }

  init(): Promise<any> {
    return this.player.init('https://raw.githubusercontent.com/dynamic-music/dymo-core/master/ontologies/')//'https://dynamic-music.github.io/dymo-core/ontologies/')
      .then(() => {
        this.store = this.player.getDymoManager().getStore();
        this.dymoGen = new DymoGenerator(this.store);
        this.mixGen = new MixGenerator(this.dymoGen, this.player);
        this.analyzer = new Analyzer(this.store);
      });
  }

  getBeatObservable(): Observable<any> {
    return (this.player.getPlayingDymoUris())
      .filter(playingDymos => {
        // TODO identify which track is playing, and associate with a specific colour
       const nChanged = _.difference(playingDymos, this.previousPlayingDymos).length;
       this.previousPlayingDymos = playingDymos;
       return nChanged > 0;
      });
  }

  async transitionToSong(audioUri: string): Promise<Transition> {
    let buffer = await (await this.player.getAudioBank()).getAudioBuffer(audioUri);
    let beats = await this.featureExtractor.extractBeats(buffer);
    let newSong = await DymoTemplates.createAnnotatedBarAndBeatDymo2(this.dymoGen, audioUri, beats);
    let keys = await this.featureExtractor.extractKey(buffer);
    this.dymoGen.setSummarizingMode(globals.SUMMARY.MODE);
    await this.dymoGen.addFeature("key", keys, newSong);
    let oldSong = _.last(this.previousSongs);
    let transition = await this.internalTransition(newSong);
    if (this.previousSongs.length > 1) {
      transition.features = await this.analyzer.getAllFeatures(oldSong, newSong);
    }
    return transition;
  }

  private async internalTransition(newSong: string): Promise<Transition> {
    await this.player.getDymoManager().loadFromStore(newSong);
    let transition// = this.defaultTransition(newSong);
    if (Math.random() > 0.5) {
      transition = this.randomTransition(newSong);
    } else {
      transition = this.startWhicheverTransitionIsBest(newSong);
    }
    this.previousSongs.push(newSong);
    this.keepOnPlaying(this.mixGen.getMixDymo());
    return transition;
  }

  private async defaultTransition(newSong: string): Promise<Transition> {
    let transition = this.getEmptyTransitionObject();
    transition.decision = DecisionType.Default;
    if (this.previousSongs.length > 0) {
      //await this.startWhicheverTransitionIsBest(newSong);
      //(this.getRandomTransition())(newDymo);
      transition.type = TransitionType.BeatRepeat;
      transition.duration = await this.mixGen.beatRepeat(newSong);
    } else {
      transition.type = TransitionType.FadeIn;
      transition.duration = await this.mixGen.startMixWithFadeIn(newSong);
    }
    return transition;
  }

  private async randomTransition(newSong: string): Promise<Transition> {
    console.log("random")
    let transition = this.getEmptyTransitionObject();
    transition.decision = DecisionType.Random;
    if (this.previousSongs.length > 0) {
      let random = (this.getRandomTransition())
      transition.type = random[1];
      transition.duration = await random[0](newSong);
    } else {
      transition.type = TransitionType.FadeIn;
      transition.duration = await this.mixGen.startMixWithFadeIn(newSong);
    }
    return transition;
  }

  private getEmptyTransitionObject(): Transition {
    return {
      date: new Date(Date.now()),
      user: null,
      rating: null,
      names: null,
      features: null,
      decision: null,
      type: null,
      parameters: null,
      duration: null
    }
  }

  private async startWhicheverTransitionIsBest(newSong: string): Promise<Transition> {
    console.log("tree")
    let transition = this.getEmptyTransitionObject();
    transition.decision = DecisionType.DecisionTree;
    const previousSong = _.last(this.previousSongs);

    if (this.previousSongs.length == 0) {
      transition.type = TransitionType.FadeIn;
      transition.duration = await this.mixGen.startMixWithFadeIn(newSong);
    } else {
      //const songBoundaries = this.analyzer.getMainSongBody(newSong);
      if (await this.analyzer.hasRegularBeats(newSong) && await this.analyzer.hasRegularBeats(previousSong)) {
        console.log("both regular")
        if (await this.analyzer.tempoSimilar(newSong, previousSong)) {
          console.log("tempo similar")
          //transition using beatmatching and tempo interpolation
          transition.type = TransitionType.Beatmatch;
          transition.duration = await this.mixGen.beatmatchCrossfade(newSong);
        }/* else if (await analyzer.tempoCloseToMultiple(newSong, previousSong)) {
          console.log("tempo multiple")
          //TODO this.mixGen.transitionImmediatelyByCrossfadeAndBeatmatchToMultiple(newSong, oldDymo);
          this.mixGen.transitionImmediatelyByCrossfadeAndBeatmatch(newSong);
        }*/ else if (await this.analyzer.getKeyDistance(newSong, previousSong) <= 2) {
          console.log("key similar")
          if (Math.random() > 0.5) {
            transition.type = TransitionType.Effects;
            transition.duration = await this.mixGen.reverbPanDirect(newSong);
          } else {
            transition.type = TransitionType.EchoFreeze;
            transition.duration = await this.mixGen.echoFreeze(newSong);
          }
        } else {
          console.log("give up")
          if (Math.random() > 0.5) {
            transition.type = TransitionType.Effects;
            transition.duration = await this.mixGen.beatRepeat(newSong);
          } else {
            transition.type = TransitionType.PowerDown;
            transition.duration = await this.mixGen.powerDown(newSong);
          }
        }
      } else if (await this.analyzer.getKeyDistance(newSong, previousSong) <= 2) {
        console.log("key similar")
        transition.type = TransitionType.EchoFreeze;
        transition.duration = await this.mixGen.echoFreeze(newSong);
      } else {
        console.log("give up")
        if (Math.random() > 0.5) {
          transition.type = TransitionType.Effects;
          transition.duration = await this.mixGen.beatRepeat(newSong);
        } else {
          transition.type = TransitionType.PowerDown;
          transition.duration = await this.mixGen.powerDown(newSong);
        }
      }
    }
    return transition;
  }

  private getRandomTransition(): [Function, TransitionType] {
    let transitions: [Function, TransitionType][] = [
      [(newDymo: string) => this.mixGen.beatmatchCrossfade(newDymo), TransitionType.Beatmatch],
      [(newDymo: string) => this.mixGen.echoFreeze(newDymo), TransitionType.EchoFreeze],
      [(newDymo: string) => this.mixGen.direct(newDymo), TransitionType.Slam],
      [(newDymo: string) => this.mixGen.beatRepeat(newDymo), TransitionType.BeatRepeat],
      [(newDymo: string) => this.mixGen.crossfade(newDymo), TransitionType.Crossfade],
      [(newDymo: string) => this.mixGen.powerDown(newDymo), TransitionType.PowerDown],
      [(newDymo: string) => this.mixGen.reverbPanDirect(newDymo), TransitionType.Effects]
    ];
    return transitions[_.random(transitions.length)];
  }

  private keepOnPlaying(dymoUri: string) {
    if (!this.isPlaying) {
      this.player.playUri(dymoUri);
      this.isPlaying = true;
    }
  }

}