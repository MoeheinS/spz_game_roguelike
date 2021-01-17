class Message {
  constructor(message, hidden) {
    this.message = message;
    this.hidden = hidden || false;
    game_state.message_history.unshift(this);
    console.log(`%c${(this.hidden ? 'DEBUG: ':'')}${this.message}`,'color:#5CC0FA;font-family:Comic Sans MS;');

    Message.updateDOM(this);
  }
  static latest(all) {
    let latest = ( all ? game_state.message_history : game_state.message_history.filter(t => !t.hidden) );
    if( latest.length ){
      return latest[0].message;
    }else{
      return 'No messages to show';
    }
  }
  static list(all) {
    let listed = ( all ? game_state.message_history : game_state.message_history.filter(t => !t.hidden) );
    console.table(listed);
    return listed;
  }
  static wipe() {
    game_state.message_history = [];
    Message.updateDOM(false,true);
  }
  static updateDOM(m, clear) {
    if( clear ){
      dom_messageWindow.querySelector('.window__title__text').innerText = 'Message history';
      return dom_messageWindow.querySelector('.window__body').innerHTML = '';
    }
    if( m.hidden ){ // TODO: implement wizardmode toggle which lets these messages get logged too
      return;
    }
    dom_messageWindow.querySelector('.window__title__text').innerText = Message.latest(false);
    let p = document.createElement('p');
        p.innerText = m.message;
        //p.dataset.repeat = 0;
    let latestMessage = dom_messageWindow.querySelector('.window__body').lastChild;
    if( latestMessage && latestMessage.innerText == m.message ){
      let repeatAttrib = ( latestMessage.dataset.repeat ? parseInt(latestMessage.dataset.repeat)+1 : 1 );
      latestMessage.dataset.repeat = repeatAttrib;
    }else{
      dom_messageWindow.querySelector('.window__body').append(p);
    }
  }
}