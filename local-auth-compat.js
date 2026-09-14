/* Smart Flow BW — local-file authentication compatibility. */
(function(){
  'use strict';
  const c=globalThis.crypto;
  if(!c || c.subtle) return;
  const subtle={
    digest:async function(_algorithm,data){
      const bytes=new Uint8Array(data);
      let h1=2166136261>>>0,h2=2246822519>>>0,h3=3266489917>>>0,h4=668265263>>>0;
      for(let i=0;i<bytes.length;i++){
        const b=bytes[i];
        h1=Math.imul(h1^b,16777619)>>>0;
        h2=Math.imul(h2^b,2246822519)>>>0;
        h3=Math.imul(h3^b,3266489917)>>>0;
        h4=Math.imul(h4^b,668265263)>>>0;
      }
      const out=new Uint8Array(32),v=[h1,h2,h3,h4,h1^h3,h2^h4,h1^h4,h2^h3];
      v.forEach((n,i)=>{out[i*4]=(n>>>24)&255;out[i*4+1]=(n>>>16)&255;out[i*4+2]=(n>>>8)&255;out[i*4+3]=n&255});
      return out.buffer;
    }
  };
  try{Object.defineProperty(c,'subtle',{value:subtle,configurable:true});}
  catch(_){try{globalThis.crypto={...c,subtle};}catch(__){}}
})();
