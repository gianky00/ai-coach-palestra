declare module 'react-native-config' {
  export interface NativeConfig {
    [key: string]: string | undefined;
  }
  const Config: NativeConfig;
  export default Config;
}

declare module 'react-native-sound' {
  type Callback = (error: Error | null) => void;
  class Sound {
    static setCategory(category: string, mixWithOthers?: boolean): void;
    constructor(
      filename: string | number,
      basePathOrCallback?: string | Callback,
      callback?: Callback,
    );
    play(onEnd?: (success: boolean) => void): void;
    setCurrentTime(seconds: number): void;
    release(): void;
  }
  export default Sound;
}

declare module 'react-native-fs' {
  const RNFS: {
    CachesDirectoryPath: string;
    DocumentDirectoryPath: string;
    writeFile: (path: string, contents: string, encoding?: string) => Promise<void>;
  };
  export default RNFS;
}

declare module 'react-native-splash-screen' {
  const SplashScreen: {
    show: () => void;
    hide: () => void;
  };
  export default SplashScreen;
}

declare module 'react-native-haptic-feedback' {
  type HapticOptions = {
    enableVibrateFallback?: boolean;
    ignoreAndroidSystemSettings?: boolean;
  };
  const ReactNativeHapticFeedback: {
    trigger: (type: string, options?: HapticOptions) => void;
  };
  export default ReactNativeHapticFeedback;
}

declare module '../../package.json' {
  const value: { version: string; name?: string };
  export default value;
}
