/** Opaque, in-memory authority for one already-existing profile preparation attempt. */
export type ProfilePreparationHandoffToken = Readonly<{
  isCurrent(): boolean;
}>;

export class ProfilePreparationHandoffSupersededError extends Error {
  constructor() {
    super("Profile preparation was superseded by a newer attempt.");
    this.name = "ProfilePreparationHandoffSupersededError";
  }
}

/** Keeps only the current attempt token and its single in-flight/completed handoff. */
export function createProfilePreparationHandoffOwner<T>() {
  let currentToken: ProfilePreparationHandoffToken | null = null;
  let completion: Readonly<{ token: ProfilePreparationHandoffToken; promise: Promise<T> }> | null = null;

  const begin = (): ProfilePreparationHandoffToken => {
    let token!: ProfilePreparationHandoffToken;
    token = Object.freeze({ isCurrent: () => currentToken === token });
    currentToken = token;
    completion = null;
    return token;
  };

  const run = (token: ProfilePreparationHandoffToken, operation: () => Promise<T>): Promise<T> => {
    if (!token.isCurrent() || currentToken !== token) return Promise.reject(new ProfilePreparationHandoffSupersededError());
    if (completion?.token === token) return completion.promise;
    const promise = Promise.resolve().then(() => {
      if (!token.isCurrent() || currentToken !== token) throw new ProfilePreparationHandoffSupersededError();
      return operation();
    });
    completion = Object.freeze({ token, promise });
    return promise;
  };

  return Object.freeze({ begin, run });
}
