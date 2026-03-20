import React, { useRef, useEffect } from 'react';
import { View, LayoutChangeEvent, Platform, StatusBar } from 'react-native';
import { useTour } from '../../context/TourContext';

interface TourTargetProps {
  id: string;
  children: React.ReactNode;
  style?: any;
}

const TourTarget: React.FC<TourTargetProps> = ({ id, children, style }) => {
  const { isTourActive, registerTarget } = useTour() as any;
  const targetRef = useRef<View>(null);

  const measure = (retryCount = 0) => {
    if (targetRef.current && targetRef.current.measureInWindow) {
      targetRef.current.measureInWindow((pageX, pageY, width, height) => {
        // Validation: On some Android versions, it returns values before layout is complete
        if (width > 0 && height > 0) {
           // Final coordinates check
           registerTarget(id, { x: pageX, y: pageY, width, height });
        } else if (retryCount < 8) {
           // Retry after a small delay
           setTimeout(() => measure(retryCount + 1), 150);
        }
      });
    }
  };

  useEffect(() => {
    if (isTourActive) {
      // Re-measure when tour becomes active or id changes
      // Wait for any screen transition animations (like the side drawer) to fully settle
      const delay = 800; 
      const timer = setTimeout(measure, delay);
      
      // Also trigger a second measure shortly after to catch any late layout adjustments
      const secondTimer = setTimeout(measure, delay + 500);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(secondTimer);
      };
    }
  }, [isTourActive, id]);

  const onLayout = () => {
      if (isTourActive) {
          measure();
      }
  };

  return (
    <View ref={targetRef} style={style} onLayout={onLayout} collapsable={false}>
      {children}
    </View>
  );
};

export default TourTarget;
