import React, { Component } from 'react';
import { StyleSheet, View, Button } from 'react-native';
import { Buffer } from 'buffer';
import Permissions from 'react-native-permissions';
import Sound from 'react-native-sound';
import AudioRecord from 'react-native-audio-record';
import wavHeaderBytes from 'wavHeaderBytes.js' // <= this just an bytes array
import axios from 'axios';

export default class App extends Component {
  sound = null;
  state = {
    audioFile: '',
    recording: false,
    loaded: false,
    paused: true,
  };

  async componentDidMount() {
    await this.checkPermission();

    function streamAudioChunk({ base64Chunk }) {
      socket && socket.emit(EVENTS.AUDIO_STREAM_CHUNK, { base64Chunk });
    }
    streamAudioChunk({
      base64Chunk: Buffer.from(wavHeaderBytes).toString("base64"),
    });
    const options = {
      sampleRate: 16000,
      channels: 1,
      bitsPerSample: 16,
      wavFile: 'test.wav',
    };

    AudioRecord.init(options);

    AudioRecord.on('data', data => {
      // base64-encoded audio data chunks
      streamAudioChunk({ base64Chunk: data });
    });
  }

  checkPermission = async () => {
    const p = await Permissions.check('microphone');
    console.log('permission check', p);
    if (p === 'authorized') {
      return;
    }
    return this.requestPermission();
  };

  requestPermission = async () => {
    const p = await Permissions.request('microphone');
    console.log('permission request', p);
  };

  start = () => {
    console.log('start record');
    this.setState({ audioFile: '', recording: true, loaded: false });
    AudioRecord.start();
  };

  stop = async () => {
    if (!this.state.recording) {
      return;
    }
    console.log('stop record');
    let audioFile = await AudioRecord.stop();
    this.setState({ audioFile, recording: false });

    const base64Data = Buffer.concat(audioPieces).toString('base64');

    console.log(streamAudioChunk);


    // const config = {
    //   headers: { "Content-Type": "multipart/form-data" },
    // };
    // //서버로 파일 전송
    // await axios
    //   .post("https://192.168.2.3:8000/voiceTest", formData, config)
    //   .then((res) => {
    //     //이상없이 데이터 분석이 완료된 경우 "음성 분석" 버튼을 그림검사로 넘어가는 "다음으로" 버튼으로 수정
    //     console.log("분석 완료!!");
    //     console.log(res);
    //   })
    //   .catch((error) => {
    //     console.log(error);
    //   });

  };

  load = () => {
    return new Promise((resolve, reject) => {
      if (!this.state.audioFile) {
        return reject('file path is empty');
      }

      this.sound = new Sound(this.state.audioFile, '', error => {
        if (error) {
          console.log('failed to load the file', error);
          return reject(error);
        }
        this.setState({ loaded: true });
        return resolve();
      });
    });
  };

  play = async () => {
    if (!this.state.loaded) {
      try {
        await this.load();
      } catch (error) {
        console.log(error);
      }
    }

    this.setState({ paused: false });
    Sound.setCategory('Playback');

    this.sound.play(success => {
      if (success) {
        console.log('successfully finished playing');
      } else {
        console.log('playback failed due to audio decoding errors');
      }
      this.setState({ paused: true });
      // this.sound.release();
    });
  };

  pause = () => {
    this.sound.pause();
    this.setState({ paused: true });
  };

  render() {
    const { recording, paused, audioFile } = this.state;
    return (
      <View style={styles.container}>
        <View style={styles.row}>
          <Button onPress={this.start} title="Record" disabled={recording} />
          <Button onPress={this.stop} title="Stop" disabled={!recording} />
          {paused ? (
            <Button onPress={this.play} title="Play" disabled={!audioFile} />
          ) : (
            <Button onPress={this.pause} title="Pause" disabled={!audioFile} />
          )}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
});
