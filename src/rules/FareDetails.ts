interface PeekHours {
  [day: string]: {
    mStart: string;
    mEnd: string;
    eStart: string;
    eEnd: string;
  };
}

export const peekHours: PeekHours = {
  weekday: {
    mStart: "7:00:00",
    mEnd: "10:30:00",
    eStart: "17:00:00",
    eEnd: "20:00:00",
  },
  weekend: {
    mStart: "9:00:00",
    mEnd: "11:00:00",
    eStart: "18:00:00",
    eEnd: "22:00:00",
  },
};

interface ZoneToZoneRules {
  [fromZone: string]: {
    [toZone: string]: number;
  };
}

export const peekFares: ZoneToZoneRules = {
  "1": {
    "1": 30,
    "2": 35,
  },
  "2": {
    "1": 35,
    "2": 25,
  },
};

export const offPeekFares: ZoneToZoneRules = {
  "1": {
    "1": 25,
    "2": 30,
  },
  "2": {
    "1": 30,
    "2": 20,
  },
};

export const dailyCapLimits: ZoneToZoneRules = {
  "1": {
    "1": 100,
    "2": 120,
  },
  "2": {
    "1": 120,
    "2": 80,
  },
};

export const weeklyCapLimits: ZoneToZoneRules = {
  "1": {
    "1": 500,
    "2": 600,
  },
  "2": {
    "1": 600,
    "2": 400,
  },
};
