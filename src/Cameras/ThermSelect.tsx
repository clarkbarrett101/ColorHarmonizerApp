import { useCallback, useEffect, useState } from "react";
import { fCLARColorToRGB, tBrand } from "../utils/CLAcolor";
import { ePanEvent, usePanManager } from "../Contexts/PanManager";
import { tAttributeMap, tAttributeModifier } from "../utils/Actor";
import { Text } from "react-native-svg";
import {
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { useRadialContext, RadialContext } from "../Radials/RadialContext";
import { tSector, tSectorGroup } from "../Radials/SectorTypes";
import { SectorGroup } from "../Radials/SectorGroup";
import { scheduleOnRN } from "react-native-worklets";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { kelvin_table, tTemp } from "./KelvinTemp";

export type tThermSelect = {
  width?: number;
  height?: number;
  tempK: number;
  setTemp: (temp: tTemp) => void;
  totalArcLength?: number;
  mainRotationR?: number;
  origin?: [number, number];
};

export const ThermSelect = (props: tThermSelect) => {
  let temps = Object.values(kelvin_table).filter(
    (t) => t.k >= 3000 && t.k % 1500 === 0,
  );
  const ctx = useRadialContext();
  const origin = props.origin || ctx.origin || [0, 0];
  const totalArcLength = props.totalArcLength || ctx.totalArcLength || 11 / 7;
  const mainRotationR = props.mainRotationR || ctx.mainRotationR || 22 / 7;
  const radius = props.width ? props.width / 2 : 50;
  const vPanPos = useSharedValue({ angle: 0, radius: 0 });
  const vPanState = useSharedValue<ePanEvent>("leave");
  const selection = useDerivedValue(() => {
    "worklet";
    let ring = 0;
    if (
      vPanPos.value.angle < mainRotationR + totalArcLength / 2 &&
      vPanPos.value.angle > mainRotationR - totalArcLength / 2
    ) {
      ring = Math.floor(
        (vPanPos.value.radius / ((temps.length * radius) / 2)) * temps.length,
      );
    }
    console.log("Ring:", ring, "Angle:", vPanPos.value.angle);
    return ring;
  }, []);
  useEffect(() => {
    for (let i = 0; i < temps.length; i++) {
      const diff = Math.abs(temps[i].k - props.tempK);
      if (diff < 750) {
        vPanPos.value = {
          angle: mainRotationR,
          radius: (i * radius) / 2,
        };
        break;
      }
    }
  }, [props.tempK]);
  useAnimatedReaction(
    () => selection.value,
    (state) => {
      const temp = temps[selection.value];
      if (temp) scheduleOnRN(props.setTemp, temp);
    },
    [],
  );
  const { registerHitBox: registerZone, unregisterHitBox: unregisterZone } =
    usePanManager();
  useEffect(() => {
    registerZone({
      id: "" + origin[0] + origin[1],
      shape: "capsule",
      priority: 10,
      origin: [origin[0], origin[1] + radius / 2],
      arcLength: totalArcLength,
      radii: [radius * 0.7, (radius * temps.length) / 2],
      rotationR: mainRotationR,
      vPanState,
      vPanPos,
    });
    return () => {
      unregisterZone("" + origin[0] + origin[1]);
    };
  }, []);
  const { vColorModel } = useUserContext();
  const mColorModifier: tAttributeModifier = {
    modID: 0,
    modifier: (input: tAttributeMap) => {
      "worklet";
      const temp = temps[input.ring || 0];
      const clar = {
        c: temp.c,
        ar: temp.ar,
        l: 0.9,
      };
      const [r, g, b] = fCLARColorToRGB(clar, vColorModel.shared.value);

      return {
        ...input,
        red: r,
        green: g,
        blue: b,
      };
    },
  };
  const mTransformModifier: tAttributeModifier = {
    modID: 1,
    deps: [selection],
    modifier: (input: tAttributeMap) => {
      "worklet";
      const x = ((1 + input.ring) * radius) / 3;

      return {
        ...input,
        translateX: x,
        zIndex:
          temps.length -
          Math.abs(selection.value - input.ring) +
          eLayers.chipHand -
          10,
      };
    },
  };
  const adjustedRotation = Math.round(mainRotationR / (11 / 7)) * (-11 / 7);
  const sectors = useCallback(() => {
    const group = [];
    for (let i = 0; i < temps.length; i++) {
      const sector: tSector = {
        arcLength: totalArcLength,
        chord: 0,
        ring: i,
        radii: [radius * 0.2, radius * 1.2],
      };
      const text = (
        <Text
          key={i}
          fontFamily="Outfit"
          fontSize={18}
          textAnchor="middle"
          fontWeight={2000}
          opacity={0.65}
          fill={"black"}
          verticalAlign={0.1}
          transform={[
            { rotate: `${adjustedRotation}rad` },
            { translateY: radius * 0.7 },
          ]}
        >
          {temps[i].k + "K"}
        </Text>
      );
      const sectorGroup: tSectorGroup = {
        arcLength: totalArcLength,
        chord: 0,
        rotationR: mainRotationR,
        sectorGroupID: i,
        ring: i,
        children: [text],
        sectors: [sector],
        origin,
      };
      group.push(<SectorGroup key={i} {...sectorGroup} />);
    }
    return group;
  }, [temps]);

  return (
    <RadialContext
      value={{
        origin,
        mColorModifier,
        radii: [radius, radius * temps.length],
        mTransformModifier,
        totalArcLength,
        mainRotationR,
      }}
    >
      {sectors()}
    </RadialContext>
  );
};
/*<tbody><tr>
<th rowspan="2" scope="col"><a href="/wiki/Wavelength" title="Wavelength">Wavelength</a> <br> (nm)
</th>
<th rowspan="2" scope="col">Approximate <br> appearance
</th>
<th scope="col"><a href="/wiki/Isaac_Newton" title="Isaac Newton">Newton</a><a href="#×"><span style="color:black" title="Quantified by McLaren"></span></a><sup id="cite_ref-mclaren_3-2" class="reference"><a href="#cite_note-mclaren-3"><span class="cite-bracket">[</span>2<span class="cite-bracket">]</span></a></sup>
</th>
<th scope="col"><a href="/wiki/ISCC-NBS" class="mw-redirect" title="ISCC-NBS">ISCC-NBS</a><a href="#×"><span style="color:black" title="Quantified by Kelly"></span></a><sup id="cite_ref-5" class="reference"><a href="#cite_note-5"><span class="cite-bracket">[</span>4<span class="cite-bracket">]</span></a></sup>
</th>
<th scope="col">Malacara<sup id="cite_ref-6" class="reference"><a href="#cite_note-6"><span class="cite-bracket">[</span>5<span class="cite-bracket">]</span></a></sup>
</th>
<th scope="col"><a href="/wiki/CRC_Handbook_of_Chemistry_and_Physics" title="CRC Handbook of Chemistry and Physics">CRC Handbook</a><sup id="cite_ref-7" class="reference"><a href="#cite_note-7"><span class="cite-bracket">[</span>6<span class="cite-bracket">]</span></a></sup>
</th></tr>
<tr>
<th>1700
</th>
<th>1943
</th>
<th>2011
</th>
<th>2006
</th></tr>
<tr>
<td>380
</td>
<td bgcolor="#010003">
</td>
<td rowspan="5">Violet
</td>
<td rowspan="6">Violet
</td>
<td rowspan="5">Violet
</td>
<td rowspan="7">Violet
</td></tr>
<tr>
<td>390
</td>
<td bgcolor="#020009">
</td></tr>
<tr>
<td>400
</td>
<td bgcolor="#080018">
</td></tr>
<tr>
<td>410
</td>
<td bgcolor="#14002E">
</td></tr>
<tr>
<td>420
</td>
<td bgcolor="#280053">
</td></tr>
<tr>
<td>430
</td>
<td bgcolor="#3B007B">
</td>
<td rowspan="2">Indigo
</td>
<td rowspan="7">Blue
</td></tr>
<tr>
<td>440
</td>
<td bgcolor="#3E0092">
</td>
<td rowspan="5">Blue
</td></tr>
<tr>
<td>450
</td>
<td bgcolor="#3200A4">
</td>
<td rowspan="4">Blue
</td>
<td rowspan="5">Blue
</td></tr>
<tr>
<td>460
</td>
<td bgcolor="#002B9B">
</td></tr>
<tr>
<td>470
</td>
<td bgcolor="#004260">
</td></tr>
<tr>
<td>480
</td>
<td bgcolor="#004A55">
</td></tr>
<tr>
<td>490
</td>
<td bgcolor="#005856">
</td>
<td rowspan="4">Green
</td>
<td rowspan="1">Blue-green
</td></tr>
<tr>
<td>500
</td>
<td bgcolor="#006E5D">
</td>
<td rowspan="5">Green
</td>
<td rowspan="2">Cyan
</td>
<td rowspan="7">Green
</td></tr>
<tr>
<td>510
</td>
<td bgcolor="#008A65">
</td></tr>
<tr>
<td>520
</td>
<td bgcolor="#00A56A">
</td>
<td rowspan="5">Green
</td></tr>
<tr>
<td>530
</td>
<td bgcolor="#00B865">
</td>
<td rowspan="5">Yellow
</td></tr>
<tr>
<td>540
</td>
<td bgcolor="#00C550">
</td></tr>
<tr>
<td>550
</td>
<td bgcolor="#34CC00">
</td>
<td rowspan="3">Yellow-green
</td></tr>
<tr>
<td>560
</td>
<td bgcolor="#82C400">
</td></tr>
<tr>
<td>570
</td>
<td bgcolor="#B1B500">
</td>
<td rowspan="1">Yellow
</td>
<td rowspan="2">Yellow
</td></tr>
<tr>
<td>580
</td>
<td bgcolor="#D5A000">
</td>
<td rowspan="4">Orange
</td>
<td rowspan="1">Yellow
</td>
<td rowspan="5">Orange
</td></tr>
<tr>
<td>590
</td>
<td bgcolor="#EF8200">
</td>
<td rowspan="2">Orange
</td>
<td rowspan="3">Orange
</td></tr>
<tr>
<td>600
</td>
<td bgcolor="#FE5D00">
</td></tr>
<tr>
<td>610
</td>
<td bgcolor="#FF2B00">
</td>
<td rowspan="13">Red
</td></tr>
<tr>
<td>620
</td>
<td bgcolor="#EB001B">
</td>
<td rowspan="8">Red
</td>
<td rowspan="13">Red
</td></tr>
<tr>
<td>630
</td>
<td bgcolor="#C90024">
</td>
<td rowspan="11">Red
</td></tr>
<tr>
<td>640
</td>
<td bgcolor="#A80022">
</td></tr>
<tr>
<td>650
</td>
<td bgcolor="#87001B">
</td></tr>
<tr>
<td>660
</td>
<td bgcolor="#680014">
</td></tr>
<tr>
<td>670
</td>
<td bgcolor="#4C000C">
</td></tr>
<tr>
<td>680
</td>
<td bgcolor="#370007">
</td></tr>
<tr>
<td>690
</td>
<td bgcolor="#250003">
</td></tr>
<tr>
<td>700
</td>
<td bgcolor="#180002">
</td>
<td rowspan="6" bgcolor="#AAAAAA">
</td></tr>
<tr>
<td>710
</td>
<td bgcolor="#0F0001">
</td></tr>
<tr>
<td>720
</td>
<td bgcolor="#080001">
</td></tr>
<tr>
<td>730
</td>
<td bgcolor="#040000">
</td></tr>
<tr>
<td>740
</td>
<td bgcolor="#020000">
</td>
<td rowspan="2" bgcolor="#AAAAAA">
</td>
<td rowspan="2" bgcolor="#AAAAAA">
</td></tr></tbody>
*/
