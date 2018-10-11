/**
* Copyright 2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

import React, { Component } from 'react';
import { Provider } from 'react-redux';

import PositionBar from './PositionBar';
import SequenceViewer from './SequenceViewer';
import SequenceOverview from './SequenceOverview';
import OverviewBar from './OverviewBar';
import Labels from './Labels';

import createMSAStore from '../store/createMSAStore';
import propsToRedux from '../store/propsToRedux';

const labelsAndSequenceDiv = {
  display: "flex",
};

// TODO: support changing the store dynamically
// TODO: when props of children update -> update store
// TODO: support using the child components in stand-alone mode
class MSAViewerComponent extends Component {

  componentWillMount() {
    //this.store = this.props.store || createMSAStore(
      //pick(this.props, MSAViewerProps)
    //);
  }
  render() {
    const {children, ...otherProps} = this.props;
    if (children) {
      return (
        <Provider store={this.props.store}>
          <div {...otherProps}>
            {children}
          </div>
        </Provider>
      );
    } else {
      // TODO: add more advanced layouts
      const currentState = this.props.store.getState();
      const labelsPadding = currentState.viewpoint.tileSizes[1];
      const overviewBarHeight = currentState.viewpoint.overviewBar.height;
      const labelsStyle = {
        paddingTop: labelsPadding + overviewBarHeight,
      }
      const separatorPadding = {
        height: 10,
      };
      return (
        <Provider store={this.props.store}>
          <div style={labelsAndSequenceDiv}>
            <Labels
              style={labelsStyle}
            />
            <div>
              <OverviewBar />
              <PositionBar />
              <SequenceViewer />
              <div style={separatorPadding} />
              <SequenceOverview />
            </div>
          </div>
        </Provider>
      );
    }
  }
}

const MSAViewer = propsToRedux(MSAViewerComponent);

MSAViewer.PropTypes = {
  // store
  // sequences, required
};

// TODO: re-include propsToRedux here?
export default MSAViewer;
export {
  createMSAStore,
  Labels,
  MSAViewer,
  OverviewBar,
  PositionBar,
  SequenceOverview,
  SequenceViewer,
};
