import React, { forwardRef } from 'react';
import { Card, CardProps } from './ui/Card';

export type BentoBoxProps = CardProps;

export const BentoBox = forwardRef<HTMLDivElement, BentoBoxProps>((props, ref) => {
  return <Card ref={ref} {...props} />;
});

BentoBox.displayName = 'BentoBox';
