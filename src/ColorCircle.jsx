import react from "react";
import { StyleSheet } from "react-native";
import { Svg } from "react-native-svg";
import { Path } from "react-native-svg";

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
    width: 125,
    height: 125,
  },
});
const ColorCircle = (colors) => {
  const numSections = colors.length;
  const height = 125;
  const width = 125;
  const crad = width / 2;
  return (
    <Svg style={styles.circle} key={colors}>
      {colors.map((color, index) => {
        const startAngle = (index * 2 * Math.PI) / numSections;
        const endAngle = ((index + 1) * 2 * Math.PI) / numSections;
        const pathData = `
                    M${height / 2} ${height / 2} 
                    L${height / 2 + crad * Math.cos(startAngle)} ${
          height / 2 + crad * Math.sin(startAngle)
        } 
                    A${crad} ${crad} 0 ${
          endAngle - startAngle > Math.PI ? 1 : 0
        } 1 
                    ${height / 2 + crad * Math.cos(endAngle)} ${
          height / 2 + crad * Math.sin(endAngle)
        } 
                    Z
                `;
        return (
          <Path
            styles={styles.circle}
            key={color + index}
            d={pathData}
            fill={color}
          />
        );
      })}
    </Svg>
  );
};
export default ColorCircle;
