import React from 'react';
import { BlogSectionInterface } from '../../state/Types';

type PropsType = {
  section: BlogSectionInterface,
}

const Photo: React.FC<PropsType> = () => (
  <div>photo</div>
);

export default Photo;
