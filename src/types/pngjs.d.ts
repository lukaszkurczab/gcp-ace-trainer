declare module "pngjs" {
  export class PNG {
    readonly width: number;
    readonly height: number;
    readonly data: Uint8Array;
    constructor(options: { width: number; height: number });
    static sync: {
      read(buffer: Uint8Array): PNG;
      write(image: PNG): Buffer;
    };
  }
}
