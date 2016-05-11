import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import superAgent from 'superagent';

const Intro = React.createClass({
  getInitialState: function(){
    return {
      access_token: 'EAACEdEose0cBAN5RyVEXxH2H7V9rBnmKd94tYqGiGGlWFR3B5ZAJElH0fnlRRWLisSIN01WKpZBd892JzTsHBn9GCfKmPwCd3QXZB3DkaZAdHobV9R6wL1MwF9qLCoie6q4iA8k7W0tX7kuzeSsyFZBSriHy04VXpsUiq2Vx98zdun4TlUwMf',
      link: 'http://franklyinc.com/',
      message: 'One platform for a multi-screen world',
      page_id: '1765848023647713',
      submitting: false
    };
  },
  onChange: function(field, e){
    this.state[field] = e.target.value;
    this.setState(this.state);
  },

  submit: function(){
    this.setState({submitting: true});
    superAgent
    .post('/api/connectFB')
    .send({
      access_token: this.state.access_token,
      link: this.state.link,
      message: this.state.message,
      page_id: this.state.page_id
    })
    .end(function(err, res){
        if(err){
          alert('Post unsuccessfully.');
        } else {
          alert('Post successfully.');
        }
        this.setState({submitting: false});
    }.bind(this));
  },
  render: function() {
    return (
      <div className="intro">
        <div className="container">
          <div className="col-md-6 col-md-offset-3">
            <h1>Post a new Feed</h1>
            <form>
              <div className="form-group">
                <label htmlFor="exampleInputEmail1">Page id</label>
                <input type="text" className="form-control" ref="page_id" placeholder="Page id" value={ this.state.page_id } onChange={this.onChange.bind(this, 'page_id')}/>
              </div>
              <div className="form-group">
                <label htmlFor="exampleInputEmail1">Access token</label>
                <input type="text" className="form-control" ref="access_token" placeholder="Access token" value={ this.state.access_token } onChange={this.onChange.bind(this, 'access_token')}/>
              </div>

              <div className="form-group">
                <label htmlFor="exampleInputEmail1">Link</label>
                <input type="text" className="form-control" ref="Link" placeholder="Link" value={ this.state.link } onChange={this.onChange.bind(this, 'link')}/>
              </div>

              <div className="form-group">
                <label htmlFor="exampleInputEmail1">Message</label>
                <input type="text" className="form-control" ref="Message" placeholder="Message" value={ this.state.message } onChange={this.onChange.bind(this, 'message')}/>
              </div>

              <button type="button" disabled={this.state.submitting} className="btn btn-default" onClick={this.submit}>{this.state.submitting ? 'Posting...' : 'Post'}</button>
            </form>
          </div>
        </div>
      </div>
    );
  }
});

function mapStateToProps() {
  return {};
}

export default connect(mapStateToProps)(Intro);