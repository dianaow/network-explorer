import React from "react";
const LegendCorrected = props => {

  const { onChange = () => {} } = props; // eslint-disable-next-line react/destructuring-assignment
  const getMergedOptions = options =>
    options.map(c => {
      const { checked } = c;
      return { ...c, checked: typeof checked === "boolean" ? checked : true };
    });
  const [options, setOptions] = React.useState(getMergedOptions(props.options));
  const handleClick = option => {
    const checkedValue = { ...option, checked: !option.checked };
    const result = options.map(c => {
      const matched = c.value === option.value;
      return matched ? checkedValue : c;
    });
    setOptions(result);
    onChange(checkedValue, result, props);
  };
  React.useEffect(() => {
    setOptions(getMergedOptions(props.options));
  }, [props.options]);

  return (
    <ul className="graphin-components-legend">
      <p>{props.label}</p>
      {options.map(option => {
        const { label, checked, color } = option;
        return (
          <li // eslint-disable-line jsx-a11y/no-noninteractive-element-interactions
            key={option.value}
            onClick={() => {
              handleClick(option);
            }}
            className="item"
            onKeyDown={() => {
              handleClick(option);
            }}
          >
            {" "}
            <span
              className="dot"
              style={{ background: checked ? color : "#ddd" }}
            />{" "}
            <span
              className="label"
              style={{ color: checked ? "#000000d9" : "#ddd" }}
            >
              {" "}
              {label}{" "}
            </span>{" "}
          </li>
        );
      })}{" "}
    </ul>
  );
};
export default LegendCorrected;
