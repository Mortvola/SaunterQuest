/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { ReactElement, ReactNode, useState } from 'react';
import { observer } from 'mobx-react-lite';

type ItemPropsType = {
  label: string;
  value: boolean;
  onChange: (key: string, value: boolean) => void;
}

const DropDownCheckItem = ({
  value,
  label,
  onChange,
}: ItemPropsType): ReactElement => {
  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    event.stopPropagation();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(label, event.target.checked);
  };

  return (
    <div
      key={label}
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      role="checkbox"
      aria-checked={value}
      tabIndex={0}
    >
      <label style={{ margin: 0 }}>
        <input type="checkbox" checked={value} onChange={handleChange} />
        {label}
      </label>
    </div>
  );
};

type PropsType = {
  items: Map<string, boolean>;
  children: ReactNode;
  onChange: (key: string, value: boolean) => void;
}

const DropDownChecks = ({
  items,
  children,
  onChange,
}: PropsType): ReactElement => {
  const [open, setOpen] = useState<boolean>(false);
  const [all, setAll] = useState<boolean>(() => (
    !Array.from(items.values()).some((value) => !value)
  ));

  const handleClick = () => {
    setOpen(!open);
  };

  const handleKeyPress = () => {
    setOpen(!open);
  };

  const handleChange = (key: string, value: boolean) => {
    if (key === 'All') {
      Array.from(items.keys()).forEach((k) => {
        onChange(k, value);
      });
      setAll(value);
    }
    else {
      onChange(key, value);
      if (value) {
        setAll(!Array.from(items.values()).some((v) => !v));
      }
      else {
        setAll(false);
      }
    }
  };

  return (
    <div
      style={{ margin: '0 4px' }}
      className="drop-down-checks"
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      role="button"
      tabIndex={0}
    >
      {children}
      {
        open
          ? (
            <div className="drop-down-check-items">
              <DropDownCheckItem label="All" value={all} onChange={handleChange} />
              {
                Array.from(items.entries()).map(([key, value]) => (
                  <DropDownCheckItem key={key} label={key} value={value} onChange={handleChange} />
                ))
              }
            </div>
          )
          : null
      }
    </div>
  );
};

export default DropDownChecks;
