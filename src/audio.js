// Synthesized engine / air noise. No audio file download, activated by a user gesture.
export class AudioEngine{
  constructor(){this.ctx=null;this.active=false;}
  async start(){
    if(this.active)return;
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx)throw new Error('Browser tidak mendukung Web Audio.');
    this.ctx=new Ctx();
    const ctx=this.ctx;
    this.mix=ctx.createGain();this.mix.gain.value=.22;this.mix.connect(ctx.destination);
    this.motor=ctx.createOscillator();this.motor.type='sawtooth';
    this.motorGain=ctx.createGain();this.motorGain.gain.value=.08;
    this.motorLow=ctx.createBiquadFilter();this.motorLow.type='lowpass';this.motorLow.frequency.value=260;
    this.motor.connect(this.motorLow);this.motorLow.connect(this.motorGain);this.motorGain.connect(this.mix);
    this.motor.start();
    const buffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);
    const samples=buffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
    this.wind=ctx.createBufferSource();this.wind.buffer=buffer;this.wind.loop=true;
    this.windFilter=ctx.createBiquadFilter();this.windFilter.type='bandpass';this.windFilter.frequency.value=440;this.windFilter.Q.value=.55;
    this.windGain=ctx.createGain();this.windGain.gain.value=.002;
    this.wind.connect(this.windFilter);this.windFilter.connect(this.windGain);this.windGain.connect(this.mix);
    this.wind.start();await ctx.resume();this.active=true;
  }
  update(telemetry){
    if(!this.active||!this.ctx)return;
    const now=this.ctx.currentTime;
    const power=telemetry.throttle/100;
    this.motor.frequency.setTargetAtTime(28+power*84,now,.08);
    this.motorLow.frequency.setTargetAtTime(170+power*520,now,.08);
    this.motorGain.gain.setTargetAtTime(.015+power*.11,now,.1);
    const rush=Math.min(1,telemetry.airspeed/65);
    this.windGain.gain.setTargetAtTime(.005+rush*.12,now,.12);
    this.windFilter.frequency.setTargetAtTime(310+rush*850,now,.1);
  }
  async stop(){
    if(!this.ctx)return;
    try{this.motor?.stop();this.wind?.stop();await this.ctx.close();}catch{}
    this.ctx=null;this.active=false;
  }
}
