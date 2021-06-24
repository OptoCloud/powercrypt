const { React } = require('powercord/webpack');
const { Button } = require('powercord/components');
const { TextInput } = require('powercord/components/settings');

module.exports = class Settings extends React.Component {
    constructor (props) {
        super();
    }

    render() {
        return (
            <div>
                 <TextInput
                        value={this.props.getSetting('text', 'Sample')}
                        onChange={v => this.props.updateSetting('text', v)}
                        note='You can input text here'
                 >
                     TextInput
                 </TextInput>
            </div>
        )
    }
}