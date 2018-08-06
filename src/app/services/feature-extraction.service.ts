import { Injectable } from '@angular/core';
import {
  OneShotExtractionClient,
  OneShotExtractionRequest as Request,
  OneShotExtractionResponse as Response,
  OneShotExtractionScheme
} from 'piper-js/one-shot';
//import { FeatureList } from 'piper-js/core';
import { toSeconds } from 'piper-js/time';
import createQmWorker from '@extractors/qm';
import { FeatureExtractor, Beat, Key } from '../mix/types';

// this spawns a web worker, which we only want to do once
// so we instantiate
const qmWorker = createQmWorker();

export interface QmExtractor {
  key: string,
  outputId: string
}

interface AudioData {
  channels: Float32Array[];
  sampleRate: number;
  duration: number;
}

function bufferToAudioData(buffer: AudioBuffer): AudioData {
  const nChannels = buffer.numberOfChannels;
  const channels = new Array<Float32Array>(nChannels);
  for (let i = 0; i < nChannels; ++i) {
    channels[i] = buffer.getChannelData(i);
  }
  return {
    channels,
    sampleRate: buffer.sampleRate,
    duration: buffer.duration
  };
}

@Injectable()
export class FeatureExtractionService implements FeatureExtractor {
  private client: OneShotExtractionClient;

  constructor() {
    this.client = new OneShotExtractionClient(
      qmWorker,
      OneShotExtractionScheme.REMOTE
    );
  }

  extract(request: Request): Promise<Response> {
    return this.client.collect(request);
  }

  private extractQmFeature(buffer: AudioBuffer, feature: QmExtractor): Promise<any> {
    const {channels, sampleRate} = bufferToAudioData(buffer);
    return this.extract({
      audioData: channels,
      audioFormat: {
        sampleRate,
        channelCount: channels.length
      },
      key: feature.key,
      outputId: feature.outputId
    }).then(response => response.features.collected);
  }

  extractBeats(buffer: AudioBuffer): Promise<Beat[]> {
    return this.extractQmFeature(buffer, {
      key: 'qm-vamp-plugins:qm-barbeattracker',
      outputId: 'beats'
    }).then(features => features.map(feature => ({
      time: {value: toSeconds(feature.timestamp)},
      label: {value: feature.label}
    })));
  }

  extractKey(buffer: AudioBuffer): Promise<Key[]> {
    return this.extractQmFeature(buffer, {
      key: 'qm-vamp-plugins:qm-keydetector',
      outputId: 'tonic'
    }).then(features => features.map(feature => ({
      time: {value: toSeconds(feature.timestamp)},
      value: feature.featureValues[0]
    })));
  }
}