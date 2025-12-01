import cpms from "./cpm.json" with {type: "json"};
import {type BaseStats} from "./gamemaster.json.types.mts";
import {z} from "zod";

/**
 * function(cpm = self.cpm, atkIV = self.ivs.atk, defIV = self.ivs.def, hpIV = self.ivs.hp){
 *        let cp = Math.floor(( (self.baseStats.atk+atkIV) * Math.pow(self.baseStats.def+defIV, 0.5) * Math.pow(self.baseStats.hp+hpIV, 0.5) * Math.pow(cpm, 2) ) / 10);
 *
 *        return cp;
 *    }
 */
export function calculateCp(
  baseStats: BaseStats,
  level: number,
  ivs: BaseStats,
) {
  z.number()
    .min(1)
    .max(51 * 2)
    .parse(level);
  const cpm = cpms[level - 1]!;
  const atk = baseStats.atk + ivs.atk;
  const def = Math.pow(baseStats.def + ivs.def, 0.5);
  const hp = Math.pow(baseStats.hp + ivs.hp, 0.5);

  return Math.floor((atk * def * hp * Math.pow(cpm, 2)) / 10);
}
