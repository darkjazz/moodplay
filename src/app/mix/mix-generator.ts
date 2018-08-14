import * as _ from 'lodash';
import { DymoPlayer } from 'dymo-player';
import { DymoGenerator, ExpressionGenerator, SuperDymoStore, uris } from 'dymo-core';
import { Transition, TransitionType } from './types';

interface MixState {
  removedOldSongBars: string[],
  newSongBars: string[],
  currentPosition: number
}

export class MixGenerator {

  private mixDymoUri: string;
  private songs: string[];
  private store: SuperDymoStore;
  private expressionGen: ExpressionGenerator;
  private transitionConstraints: string[][] = []; //ARRAYS OF CONSTRAINT URIS FOR NOW

  constructor(private generator: DymoGenerator, private player: DymoPlayer) {
    this.store = generator.getStore();
    this.expressionGen = new ExpressionGenerator(this.store);
    this.init();
  }

  async init() {
    this.songs = [];
    this.mixDymoUri = await this.generator.addDymo();
  }

  getMixDymo(): string {
    return this.mixDymoUri;
  }

  async startMixWithFadeIn(songUri: string, numBars = 2): Promise<Transition> {
    const newSongBars = await this.registerSongAndGetBars(songUri);
    const [duration, uris] = await this.applyFadeIn(newSongBars.slice(0, numBars));
    return this.endTransition(newSongBars, TransitionType.FadeIn, duration, uris);
  }

  async slam(songUri: string, offsetBars = 0): Promise<Transition> {
    const state = await this.initTransition(songUri, offsetBars);
    return this.endTransition(state.newSongBars, TransitionType.Slam, 0);
  }

  async beatRepeat(songUri: string, times = 2, offsetBars = 0): Promise<Transition> {
    const state = await this.initTransition(songUri, offsetBars);
    //add reverb to last bar
    let lastBar = await this.store.findPartAt(this.mixDymoUri, state.currentPosition);
    let lastBeat = await this.store.findPartAt(lastBar, 3);
    await this.store.setParameter(lastBeat, uris.REVERB, 0.5);
    //add silence for first part of bar
    let lastBarDuration = await this.store.findFeatureValue(state.removedOldSongBars[0], uris.DURATION_FEATURE);
    await this.addSilence(lastBarDuration/2);
    //beat repeat
    let firstBarBeats = await this.store.findParts(state.newSongBars[0]);
    await this.addPartsToMix(_.fill(Array(times), firstBarBeats[0]));
    return this.endTransition(state.newSongBars, TransitionType.BeatRepeat, 2); //duration just an estimate for now
  }

  async echoFreeze(songUri: string, numBarsBreak = 1): Promise<Transition> {
    const state = await this.initTransition(songUri);
    //delay out last bar
    let lastBar = await this.store.findPartAt(this.mixDymoUri, state.currentPosition);
    await this.store.setParameter(lastBar, uris.DELAY, 1);
    //add silence for n bars
    let lastBarDuration = await this.store.findFeatureValue(lastBar, uris.DURATION_FEATURE);
    await this.addSilence(lastBarDuration*numBarsBreak);
    const duration = lastBarDuration*(numBarsBreak+1);
    return this.endTransition(state.newSongBars, TransitionType.EchoFreeze, duration);
    //currently delays need to be initialized for this to work
    //return Promise.all(newSongBars.map(p => this.store.setParameter(p, uris.DELAY, 0)));
  }

  async reverbPanDirect(songUri: string, numBars = 3, offsetBars = 0): Promise<Transition> {
    const state = await this.initTransition(songUri, offsetBars, numBars);
    let lastBars = (await this.store.findParts(this.mixDymoUri)).slice(-numBars);
    //power down last few bars
    let lastBarDuration = await this.store.findFeatureValue(lastBars[0], uris.DURATION_FEATURE);
    let effectsDuration = lastBarDuration*numBars;
    let effectsRamp = await this.addRampWithTrigger(effectsDuration);
    let reverb = await this.makeRampConstraint(effectsRamp, lastBars, 'Reverb(d) == r');
    return this.endTransition(state.newSongBars, TransitionType.Effects, effectsDuration, [effectsRamp, reverb]);
  }

  async powerDown(songUri: string, numBars = 2, numBarsBreak = 0): Promise<Transition> {
    const state = await this.initTransition(songUri, undefined, numBars);
    let lastBars = (await this.store.findParts(this.mixDymoUri)).slice(-numBars);
    //power down last few bars
    let lastBarDuration = await this.store.findFeatureValue(lastBars[0], uris.DURATION_FEATURE);
    let powerDuration = lastBarDuration*numBars*2;
    let powerRamp = await this.addRampWithTrigger(powerDuration);
    let powerDown = await this.makeRampConstraint(powerRamp, lastBars, 'PlaybackRate(d) == 1-r');
    let powerDown2 = await this.makeSetsConstraint(
      [['d',lastBars]], 'DurationRatio(d) == 1/PlaybackRate(d)');
    await this.loadTransition(powerRamp, powerDown, powerDown2);
    //add silence for n bars
    await this.addSilence(lastBarDuration*numBarsBreak);
    //add new song
    return this.endTransition(state.newSongBars, TransitionType.PowerDown, powerDuration + numBarsBreak);
  }

  async crossfade(songUri: string, numBars = 3, offsetBars = 0): Promise<Transition> {
    const state = await this.initTransition(songUri, offsetBars);
    let newSongTrans = state.newSongBars.slice(0, numBars);
    let oldSongTrans = await this.applyAlign(state.removedOldSongBars, newSongTrans);
    let [duration, uris] = await this.applyCrossfade(oldSongTrans, newSongTrans);
    return this.endTransition(state.newSongBars.slice(numBars), TransitionType.Crossfade, duration, uris);
  }

  async beatmatchCrossfade(songUri: string, numBars = 4, offsetBars = 0): Promise<Transition> {
    const state = await this.initTransition(songUri, offsetBars);
    let newSongTrans = state.newSongBars.slice(0, numBars);
    let oldSongTrans = await this.applyPairwiseAlign(state.removedOldSongBars, newSongTrans);
    let [duration, uris1] = await this.applyCrossfade(oldSongTrans, newSongTrans);
    let uris2 = await this.applyBeatmatch(oldSongTrans, newSongTrans, uris1[0]);
    return this.endTransition(state.newSongBars.slice(numBars), TransitionType.Beatmatch, duration, uris1.concat(uris2));
  }

  private async addPartsToMix(parts: string[]) {
    return Promise.all(parts.map(p => this.store.addPart(this.mixDymoUri, p)));
  }

  private async addSilence(duration: number) {
    if (duration > 0) {
      let silence = await this.generator.addDymo();
      await this.store.setFeature(silence, uris.DURATION_FEATURE, duration);
      await this.addPartsToMix([silence]);
    }
  }

  //returns uris of parts of old song that are part of transition
  private async applyAlign(restOfOldSong: string[], newSongTransitionBars: string[]): Promise<string[]> {
    //only keep the bars needed for the transition
    //TODO MAKE DURATION DEPENDENT ON NEW SONG!!!!
    let oldSongBars = restOfOldSong.slice(0, newSongTransitionBars.length);
    let oldSongSeq = await this.generator.addDymo(null, null, uris.SEQUENCE);
    await Promise.all(oldSongBars.map(p => this.store.addPart(oldSongSeq, p)));
    let newSongSeq = await this.generator.addDymo(null, null, uris.SEQUENCE);
    await Promise.all(newSongTransitionBars.map(p => this.store.addPart(newSongSeq, p)));
    await this.generator.addConjunction(this.mixDymoUri, [oldSongSeq, newSongSeq]);
    return oldSongBars;
  }

  private async applyPairwiseAlign(restOfOldSong: string[], newSongTransitionBars: string[]) {
    let oldSongBars = restOfOldSong.slice(0, newSongTransitionBars.length);
    let barPairs = _.zip(oldSongBars, newSongTransitionBars);
    barPairs.forEach(bp => this.generator.addConjunction(this.mixDymoUri, bp));
    return oldSongBars;
  }

  private async applyBeatmatch(oldSongBars: string[], newSongBars: string[], rampUri: string) {
    //create tempo transition
    let tempoParam = await this.generator.addCustomParameter(uris.CONTEXT_URI+"Tempo");
    let newTempo = await this.getTempoFromBars(newSongBars);
    let oldTempo = await this.getTempoFromBars(oldSongBars);
    let tempoTransition = await this.makeSetsConstraint(
      [['t',[tempoParam]], ['r',[rampUri]]], 't == r*'+newTempo+'+(1-r)*'+oldTempo);
    //create beatmatch
    let beats = _.flatten(await Promise.all(oldSongBars.concat(newSongBars).map(p => this.store.findParts(p))));
    let beatMatch = await this.makeSetsConstraint(
      [['d',beats], ['t',[tempoParam]]], 'PlaybackRate(d) == t/60*DurationFeature(d)');
    let beatMatch2 = await this.makeSetsConstraint(
      [['d',beats]], 'DurationRatio(d) == 1/PlaybackRate(d)');
    console.log("beatmatched between tempos", oldTempo, newTempo);
    return [tempoTransition, beatMatch, beatMatch2];
  }

  private async applyFadeIn(newSongBarsParts: string[]): Promise<[number, string[]]> {
    let fadeDuration = await this.getTotalDuration(newSongBarsParts);
    let fadeRamp = await this.addRampWithTrigger(fadeDuration);
    let fadeIn = await this.makeRampConstraint(fadeRamp, newSongBarsParts, 'Amplitude(d) == r');
    console.log("fading in for", newSongBarsParts.length, "bars ("+fadeDuration+" seconds)")
    return [fadeDuration, [fadeRamp, fadeIn]]
  }

  private async applyCrossfade(oldSongParts: string[], newSongParts: string[]): Promise<[number, string[]]> {
    //this duration calculation works even for tempointerpolated beatmatch!
    let fadeDuration = (await this.getTotalDuration(oldSongParts.concat(newSongParts)))/2;
    let fadeRamp = await this.addRampWithTrigger(fadeDuration);
    let fadeIn = await this.makeRampConstraint(fadeRamp, newSongParts, 'Amplitude(d) == r');
    let fadeOut = await this.makeRampConstraint(fadeRamp, oldSongParts, 'Amplitude(d) == 1-r');
    console.log("crossfading for", newSongParts.length, "bars (", fadeDuration, "seconds)");
    return [fadeDuration, [fadeRamp, fadeIn, fadeOut]];
  }

  //TODO dymo-core throws the occasional error due to list editing concurrency problem
  private async addRandomBeatToLoop(songUri: string, loopDuration = 2): Promise<any> {
    let currentBeats = await this.store.findParts(this.mixDymoUri);
    //find a random beat in the song
    let bars = await this.registerSongAndGetBars(songUri);
    let randomBar = bars[_.random(bars.length)];
    let randomBeat = (await this.store.findParts(randomBar))[_.random(4)];
    if (currentBeats.length == 0) {
      //add silence at beginning and end of loop to ensure constant length :/
      let silenceUri = await this.generator.addDymo(this.mixDymoUri);
      await this.store.setParameter(silenceUri, uris.ONSET, 0);
      silenceUri = await this.generator.addDymo(this.mixDymoUri);
      await this.store.setParameter(silenceUri, uris.ONSET, loopDuration);
      currentBeats = await this.store.findParts(this.mixDymoUri);
    }
    //set a random onset and add the beat to the loop at correct position
    let currentOnsets = await Promise.all(currentBeats.map(b => this.store.findParameterValue(b, uris.ONSET)));
    let randomOnset = _.random(loopDuration, true);
    await this.store.setParameter(randomBeat, uris.ONSET, randomOnset);
    let beatPosition = currentOnsets.filter(o => o < randomOnset).length;
    return this.store.insertPartAt(this.mixDymoUri, randomBeat, beatPosition);
  }

  async transitionImmediatelyToRandomBars(songUri: string, numBars = 2): Promise<any> {
    let bars = await this.registerSongAndGetBars(songUri);
    let randomBar = _.random(bars.length-numBars);
    return Promise.all(bars.slice(randomBar, randomBar+numBars).map(p =>
      this.store.addPart(this.mixDymoUri, p)));
  }

  /**loads the controls and constraints and adds the latter to the list*/
  private async loadTransition(...uris: string[]): Promise<any> {
    const loaded = await this.player.getDymoManager().loadFromStore(...uris);
    //TODO NOW ADD CONSTRAINT TRIGGERS
    await this.addConstraintTriggers(loaded.constraintUris);
    this.transitionConstraints.push(loaded.constraintUris);
  }

  /**removes old song until current position + offset, registers new song and gets bars*/
  private async initTransition(songUri: string, newOffsetBars?: number,
      removedOffset = 1): Promise<MixState> {
    const newSongBars = await this.registerSongAndGetBars(songUri, newOffsetBars);
    const currentPos = await this.player.getPosition(this.mixDymoUri);
    const oldSongBars = await this.store.removeParts(this.mixDymoUri, currentPos+removedOffset);
    return {removedOldSongBars: oldSongBars, newSongBars: newSongBars, currentPosition: currentPos};
  }

  /**adds new song bars and returns transition object*/
  private async endTransition(newSongBars: string[], type: TransitionType, duration: number, transitionUris?: string[]): Promise<Transition> {
    if (uris) await this.loadTransition(...transitionUris);
    await this.addPartsToMix(newSongBars);
    return this.getTransitionObject(type, duration);
  }

  private async registerSongAndGetBars(songUri: string, offset = 0): Promise<string[]> {
    this.songs.push(songUri);
    let bars = await this.store.findParts(songUri);
    return bars.slice(offset);
  }

  private async addRampWithTrigger(duration: number) {
    const rampUri = await this.generator.addRampControl(0, duration, 100);
    await this.addControlTrigger(rampUri);
    return rampUri;
  }

  private async addControlTrigger(controlUri: string) {
    const trigger = await this.generator.getStore()
      .setControlParam(controlUri, uris.AUTO_CONTROL_TRIGGER, 0);
    await this.generator.addEvent(this.mixDymoUri, trigger, 1);
  }

  private async addConstraintTriggers(newUris: string[]) {
    if (this.transitionConstraints.length > 1) {
      const previousConstraints = _.last(this.transitionConstraints);
      /*TODO ADD EVENT TO DEACTIVATE PREVIOUS CONSTRAINTS AND ACTIVATE NEW ONES
      this.store.deactivateConstraints(previousConstraints);*/
    }
  }

  private async makeCrossfade(rampUri: string, oldSongUris: string[], newSongUris: string[]): Promise<string[]> {
    var fadeOut = await this.makeRampConstraint(rampUri, oldSongUris, 'Amplitude(d) == 1-r');
    var fadeIn = await this.makeRampConstraint(rampUri, newSongUris, 'Amplitude(d) == r');
    /*var fadeOut2 = await this.makeRampConstraint(rampUri, oldSongUris, 'DurationRatio(d) == 1/(1-r)');
    var fadeIn2 = await this.makeRampConstraint(rampUri, newSongUris, 'DurationRatio(d) == 1/r');*/
    return [fadeOut, fadeIn].filter(c => c); //remove undefined
  }

  private makeRampConstraint(rampUri: string, dymoUris: string[], expression: string): Promise<string> {
    if (dymoUris.length > 0) {
      return this.makeSetsConstraint([['d',dymoUris], ['r',[rampUri]]], expression);
    }
  }

  private makeSetsConstraint(sets: [string,string[]][], expression: string): Promise<string> {
    let vars = sets.map(s => '∀ '+s[0]+' in '+JSON.stringify(s[1])+' => ').join('');
    return this.expressionGen.addConstraint(this.mixDymoUri, vars+expression, true);
  }

  private async getTempoFromBars(barUris: string[]): Promise<number> {
    let avgDuration = _.mean(await this.getFeature(barUris, uris.DURATION_FEATURE));
    return 60/(avgDuration/4);
  }

  private async getTotalDuration(dymoUris: string[]): Promise<number> {
    return _.sum(await this.getFeature(dymoUris, uris.DURATION_FEATURE));
  }

  private async getFeature(dymoUris: string[], featureUri: string): Promise<number[]> {
    return Promise.all(dymoUris.map(d => this.store.findFeatureValue(d, featureUri)));
  }

  private getTransitionObject(type: TransitionType, duration: number): Transition {
    return {
      date: new Date(Date.now()),
      user: null,
      rating: null,
      names: null,
      features: null,
      decision: null,
      type: type,
      parameters: null,
      duration: duration
    }
  }

}