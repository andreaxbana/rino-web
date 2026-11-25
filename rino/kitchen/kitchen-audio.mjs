function createVoice(words,enabled,onUnavailable){
    let current=null,utterance=null,timer=0,sequence=0,context=null;
    const buffers=new Map();
    function stop(){
      sequence++;clearTimeout(timer);
      if(current){try{current.stop();}catch{} current=null;}
      if(utterance){speechSynthesis.cancel();utterance=null;}
    }
    function unlock(){
      if(!enabled())return;
      try{
        const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
        if(Audio && (!context||context.state==='closed'))context=new Audio();
        if(context?.state==='suspended')void context.resume().catch(()=>{});
      }catch{}
    }
    function fallback(text,token){
      if(token!==sequence||!enabled())return;
      if(!globalThis.speechSynthesis||!globalThis.SpeechSynthesisUtterance){onUnavailable();return;}
      utterance=new SpeechSynthesisUtterance(text);
      utterance.lang='ja-JP';utterance.rate=.88;
      const voice=speechSynthesis.getVoices().find(v=>/^ja(?:-|_|$)/i.test(v.lang));
      if(voice)utterance.voice=voice;
      utterance.onerror=()=>{if(token===sequence)onUnavailable();};
      speechSynthesis.speak(utterance);
    }
    async function buffer(key){
      if(!buffers.has(key)){
        const pending=fetch(new URL(key+'.wav',import.meta.url)).then(response=>{
          if(!response.ok)throw new Error('Recording unavailable');
          return response.arrayBuffer();
        }).then(bytes=>context.decodeAudioData(bytes));
        buffers.set(key,pending);pending.catch(()=>buffers.delete(key));
      }
      return buffers.get(key);
    }
    function play(key,delay=0){
      stop();
      if(!enabled()||!words[key])return;
      unlock();
      const token=sequence;
      async function start(){
        try{
          if(!context)throw new Error('Audio unavailable');
          if(context.state!=='running')await context.resume();
          if(token!==sequence)return;
          const audio=await buffer(key);
          if(token!==sequence||!enabled())return;
          current=context.createBufferSource();current.buffer=audio;current.connect(context.destination);
          const source=current;source.onended=()=>{source.disconnect();if(current===source)current=null;};source.start();
        }catch{fallback(words[key].reading,token);}
      }
      if(delay)timer=setTimeout(start,delay);else void start();
    }
    return {play,stop,unlock};
  }

export {createVoice};
