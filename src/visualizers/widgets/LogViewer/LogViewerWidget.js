/*globals define, _*/
/*jshint browser: true*/

define([
    'widgets/TextEditor/TextEditorWidget',
    'css!./styles/LogViewerWidget.css'
], function (
    TextEditorWidget
) {
    'use strict';

    var LogViewerWidget,
        ANSI_COLORS = [
            'black',
            'red',
            'green',
            'yellow',
            'blue',
            'magenta',
            'cyan',
            'gray'
        ];

    LogViewerWidget = function () {
        this.readOnly = true;
        TextEditorWidget.apply(this, arguments);
        this._el.addClass('log-viewer');
        this.editor.setTheme('ace/theme/twilight');
        this.editor.setShowPrintMargin(false);

        // Override the textlayer to add support for ansi colors
        this.customizeAce();
    };

    _.extend(LogViewerWidget.prototype, TextEditorWidget.prototype);

    LogViewerWidget.prototype.getHeader = function(desc) {
        return `Console logging for Operation "${desc.name}":\n`;
    };

    LogViewerWidget.prototype.customizeAce = function() {
        var textLayer = this.editor.renderer.$textLayer,
            renderToken = textLayer.$renderToken;

        textLayer.$renderToken = function(builder, col, token, value) {
            // check for ansi color
            var ansiBuilder = LogViewerWidget.renderAnsiFromText(value),
                newToken;

            for (var i = 1; i < ansiBuilder.length; i+= 3) {
                builder.push(ansiBuilder[i-1]);
                value = ansiBuilder[i];
                newToken = {
                    type: token.type,
                    value: value
                };
                col = renderToken.call(this, builder, col, newToken, value);
                builder.push(ansiBuilder[i+1]);
            }

            return col;
        };
    };

    // Get the editor text and update wrt ansi colors
    LogViewerWidget.renderAnsiFromText = function(remaining) {
        var r = /\[0(;3([0-7]))?m/,
            match,
            ansiCode,
            text,
            color,
            nextColor = 'default',
            builder = [];

        color = color || nextColor;
        while (remaining) {
            match = remaining.match(r);
            if (match) {
                ansiCode = match[0];
                nextColor = ANSI_COLORS[match[2]] || null;
                text = remaining.substring(0, match.index);
                remaining = remaining.substring(match.index+ansiCode.length);
            } else {
                text = remaining;
                remaining = '';
            }

            // Add a "span" node w/ the appropriate color class
            builder.push(`<span class='ansi-${color}'>`, text, '</span>');

            color = nextColor;
            nextColor = 'default';
        }
        return builder;
    };

    LogViewerWidget.prototype.getSessionOptions = function() {
        return {
            firstLineNumber: -1
        };
    };

    LogViewerWidget.prototype.getEditorOptions = function() {
        return {
            fontSize: '10pt'
        };
    };

    return LogViewerWidget;
});