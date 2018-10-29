/**
* Copyright 2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import createRef from 'create-react-ref/lib/createRef';
import {
  forOwn,
  omit,
} from 'lodash-es';

import assert from '../assert';

/**
 * Injects the position store functionality in the requiring components.
 * This won't trigger state updates to prevent React Tree calculcuation at the utmost cost.
 *
 * @param {Object} Component - class to inject the position store into
 * @param {Object} Configuration - which parts of the position store to check for smart rerendering
 *
 * Select from:
 * - `withY` (`yPosOffset`, `currentViewSequence`)
 * - `withX` (`xPosOffset`, `currentViewSequencePosition`)
 *
 * Multiple selections are allowed.
 *
 * It will pass the following functionality properties:
 *
 * (a) `position` (current state of the position store)
 * WARNING: this gets updated in-place to avoid react rerenders
 *
 * (b) `positionDispatch` (dispatch method for the position store)
 *
 * If a component implements `updateScrollPosition`, it will be called after
 * every store update. Otherwise a default implementation will be used.
 *
 * (1) `updateFromPositionStore`
 * (2) `shouldRerender`

 */
function withPositionConsumer(Component, {withX = false, withY = false} = {}) {
  class MSAPositionConsumer extends PureComponent {
    constructor(props) {
      super(props);
      this.el = createRef();
    }

    componentDidMount() {
      // update to all updates from the position store
      this.unsubscribe = this.context.positionMSAStore.subscribe(this.updateFromPositionStore);
    }

    componentDidUpdate(){
      this.updateScrollPosition();
    }

    componentWillUnmount() {
      this.unsubscribe();
    }

    /**
     * a method which updates this.position from the PositionStore
     * when `shouldRerender` returns true, calls `setState({position: positionState})` is called
     * always calls `updateScrollPosition`
     */
    updateFromPositionStore = () => {
      assert(this.context && this.context.positionMSAStore,
        "MSA PositionStore needs to be injected"
      );
      const state = this.context.positionMSAStore.getState();
      this.position = this.position || {};
      // copy-over the entire state
      forOwn(state, (v, k) => {
        if (k !== "position") {
          this.position[k] = v;
        }
      });
      if (state.position) {
        this.position.xPos = state.position.xPos;
        this.position.yPos = state.position.yPos;
      }
      // not called on the first render
      if (this.el.current) {
        if (this.shouldRerender()) {
          // this will always force a rerender as position is a new object
          this.position = {...this.position};
          this.setState({
            position: this.position,
          });
        } else {
          this.updateScrollPosition();
        }
      }
    }

    /**
     * If the child defines this method, it will be called.
     * Otherwiese
     * - determine if the current viewpoint still has enough nodes
     * - checks the respective viewports when `withX` or `withY` have been set
     */
    shouldRerender = () => {
      const it = this.el.current;
      if (it.shouldRerender !== undefined) {
        return it.shouldRerender();
      }
      const cacheElements = this.props.cacheElements || it.props.cacheElements; // TODO
      if (withY) {
        if (Math.abs(this.position.currentViewSequence - this.position.lastCurrentViewSequence) >= cacheElements) {
          return true;
        }
      }
      if (withX) {
        if (Math.abs(this.position.currentViewSequencePosition - this.position.lastCurrentViewSequencePosition) >= cacheElements) {
          return true;
        }
      }
      return false;
    }


    /**
     * If the child defines this method, it will be called.
     * Otherwise the default implementation will be used which sets `this.el.current.scroll{Left,Top}` (depending on with{X,Y})
     */
    updateScrollPosition = () => {
      const it = this.el.current;
      if (it.updateScrollPosition !== undefined) {
        it.updateScrollPosition();
        return;
      }
      if (it.el && it.el.current) {
        if (withX) {
          const tileWidth = this.props.tileWidth || it.props.tileWidth;
          let offsetX = -this.position.xPosOffset;
          offsetX += (this.position.lastCurrentViewSequencePosition - this.position.lastStartXTile) * tileWidth;
          if (this.position.currentViewSequencePosition !== this.position.lastCurrentViewSequencePosition) {
            offsetX += (this.position.currentViewSequencePosition - this.position.lastCurrentViewSequencePosition) * tileWidth;
          }
          it.el.current.scrollLeft = offsetX;
        }
        if (withY) {
          const tileHeight = this.props.tileHeight || it.props.tileHeight;
          let offsetY = -this.position.yPosOffset;
          offsetY += (this.position.lastCurrentViewSequence - this.position.lastStartYTile) * tileHeight;
          if (this.position.currentViewSequence !== this.position.lastCurrentViewSequence) {
            offsetY += (this.position.currentViewSequence - this.position.lastCurrentViewSequence) * tileHeight;
          }
          it.el.current.scrollTop = offsetY;
        }
      }
    }

    dispatch = (payload) => {
      this.context.positionMSAStore.dispatch(payload);
    }

    render() {
      if (!this.hasBeenInitialized) {
        this.updateFromPositionStore();
        this.hasBeenInitialized = true;
      }
      return React.createElement(Component, {
        ref:this.el,
        position: this.position,
        positionDispatch: this.dispatch,
        ...omit(this.props, ['withX', 'withY']),
      });
    }
  }
  MSAPositionConsumer.displayName = `withPosition(${Component.displayName || Component.name})`;
  MSAPositionConsumer.contextTypes = {
    positionMSAStore: PropTypes.object,
  }

  return MSAPositionConsumer;
}
export default withPositionConsumer;
