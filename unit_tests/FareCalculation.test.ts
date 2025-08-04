import { describe, test, expect } from "@jest/globals";
import FareCalculation from "../src/FareCalcution";
import * as inputFile1 from "./data/listJourney.json";
import * as inputFile2 from "./data/listJourney_cap.json";
import * as inputFile3 from "./data/listJourney_peek_hr.json";
import * as inputFile4 from "./data/listJourney_invalid.json";
import * as inputFile5 from "./data/listJourney_cap_zone1.json";
import * as inputFile6 from "./data/listJourney_cap_zone2.json";
import * as inputFile7 from "./data/listJourney_next_yr_zone1.json";

describe("Daily Fare Calculations", () => {
  const fareCalc = new FareCalculation();

  test("Normal fare or below limit", () => {
    let fareMap = fareCalc.calculateFares(inputFile1);
    expect(fareMap.singleFares[0].dateOrWeek).toEqual(
      "Tue Jul 29 2025 16:50:00"
    );
    expect(fareMap.singleFares[0].fare).toEqual(30);
  });

  test("Reached daily cap farthest zone 1-2", () => {
    let fareMap = fareCalc.calculateFares(inputFile2);
    expect(fareMap.singleFares[2].dateOrWeek).toEqual(
      "Mon Jul 28 2025 09:20:00"
    );
    expect(fareMap.singleFares[2].fare).toEqual(15);
    expect(fareMap.singleFares[3].dateOrWeek).toEqual(
      "Mon Jul 28 2025 10:00:00"
    );
    expect(fareMap.singleFares[3].fare).toEqual(0);
  });

  test("Reached daily cap same zone 1-1", () => {
    let fareMap = fareCalc.calculateFares(inputFile2);
    expect(fareMap.singleFares[7].dateOrWeek).toEqual(
      "Tue Jul 29 2025 18:00:00"
    );
    expect(fareMap.singleFares[7].fare).toEqual(5);
    expect(fareMap.singleFares[8].dateOrWeek).toEqual(
      "Tue Jul 29 2025 19:00:00"
    );
    expect(fareMap.singleFares[8].fare).toEqual(0);
  });

  test("Reached daily cap same zone 2-2", () => {
    let fareMap = fareCalc.calculateFares(inputFile1);
    expect(fareMap.singleFares[11].dateOrWeek).toEqual(
      "Thu Jul 31 2025 21:00:00"
    );
    expect(fareMap.singleFares[11].fare).toEqual(10);
  });

  test("Morning peek hour", () => {
    let fareMap = fareCalc.calculateFares(inputFile3);
    expect(fareMap.singleFares[0].dateOrWeek).toEqual(
      "Tue Jul 29 2025 10:00:00"
    );
    expect(fareMap.singleFares[0].fare).toEqual(30); // 1-1
  });

  test("Evening peek hour", () => {
    let fareMap = fareCalc.calculateFares(inputFile3);
    expect(fareMap.singleFares[1].dateOrWeek).toEqual(
      "Wed Jul 30 2025 19:50:00"
    );
    expect(fareMap.singleFares[1].fare).toEqual(25); // 2-2
  });

  test("Morning off-peek hour", () => {
    let fareMap = fareCalc.calculateFares(inputFile3);
    expect(fareMap.singleFares[2].dateOrWeek).toEqual(
      "Thu Jul 31 2025 10:33:00"
    ); //10:33 which is 3 minutes past peek hour 10:30
    expect(fareMap.singleFares[2].fare).toEqual(20); // 2-2
  });

  test("Evening off-peek hour", () => {
    let fareMap = fareCalc.calculateFares(inputFile3);
    expect(fareMap.singleFares[3].dateOrWeek).toEqual(
      "Fri Aug 01 2025 10:33:00"
    );
    expect(fareMap.singleFares[3].fare).toEqual(25); // 1-1
  });

  test("Invalid date input", () => {
    let fareMap = fareCalc.calculateFares(inputFile4);
    expect(fareMap.singleFares[0].dateOrWeek).toMatch("Invalid Date");
  });
});

describe("Weekly Fare Calculations", () => {
  const fareCalc = new FareCalculation();
  // This also tests "Weekly cap applied prior to daily cap"
  test("Weekly cap reached zone 1", () => {
    let fareMap = fareCalc.calculateFares(inputFile5);
    expect(fareMap.weekFares[5].dateOrWeek).toEqual("Sat Aug 02 2025");
    expect(fareMap.weekFares[5].fare).toEqual(40);
    expect(fareMap.weekFares[6].dateOrWeek).toEqual("Sun Aug 03 2025");
    expect(fareMap.weekFares[6].fare).toEqual(0);
  });

  // This also tests "Weekly cap applied prior to daily cap"
  test("Weekly cap reached zone 2", () => {
    let fareMap = fareCalc.calculateFares(inputFile6);
    expect(fareMap.weekFares[6].dateOrWeek).toEqual("Sun Aug 03 2025");
    expect(fareMap.weekFares[6].fare).toEqual(5);
  });

  test("Weekly cap reached but day falls in next year", () => {
    let fareMap = fareCalc.calculateFares(inputFile7);
    expect(fareMap.weekFares[4].dateOrWeek).toEqual("Fri Jan 03 2025");
    expect(fareMap.weekFares[4].fare).toEqual(20);
    expect(fareMap.weekFares[5].dateOrWeek).toEqual("Sat Jan 04 2025");
    expect(fareMap.weekFares[5].fare).toEqual(0);
  });

  test("Weekly cap reached farthest zone", () => {
    let fareMap = fareCalc.calculateFares(inputFile2);
    expect(fareMap.weekFares[6].dateOrWeek).toEqual("Sun Aug 03 2025");
    expect(fareMap.weekFares[6].fare).toEqual(0);
  });

  test("Second weekly cap after previous week reaching cap", () => {
    let fareMap = fareCalc.calculateFares(inputFile2);
    expect(fareMap.weekFares[7].dateOrWeek).toEqual("Mon Aug 04 2025");
    expect(fareMap.weekFares[7].fare).toEqual(60);
  });

  test("Weekend peek hour", () => {
    let fareMap = fareCalc.calculateFares(inputFile3);
    expect(fareMap.weekFares[4].dateOrWeek).toEqual("Sat Aug 02 2025");
    expect(fareMap.weekFares[4].fare).toEqual(35); // 1-2
  });

  test("Weekend off-peek hour", () => {
    let fareMap = fareCalc.calculateFares(inputFile3);
    expect(fareMap.weekFares[5].dateOrWeek).toEqual("Sun Aug 03 2025");
    expect(fareMap.weekFares[5].fare).toEqual(25); // 1-1
  });
});
