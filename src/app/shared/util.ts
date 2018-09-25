const names = [
  "atete", "kianda", "emotan", "ayaba", "gleti", "mawu", "kaikara", "aja", "oba",
  "oshun", "ayao", "mamlambo", "olapa", "nambi", "manat", "nuha", "bagmasti", "saris",
  "nane", "nar", "huba", "wala", "bila", "dilga", "ekhi", "tanit"
];

/**
* Creates GUID for user based on several different browser variables
* It will never be RFC4122 compliant but it is robust
*/
export function getUserGuid(): string {
   const nav = window.navigator;
   const screen = window.screen;
   let guid: string = nav.mimeTypes.length.toString();
   guid += nav.userAgent.replace(/\D+/g, '');
   guid += nav.plugins.length;
   guid += screen.height || '';
   guid += screen.width || '';
   guid += screen.pixelDepth || '';
   return guid;
};

export function generateName(): string {
  var index = Math.floor((Math.random() * names.length)) - 1;
  return names[index];
}
