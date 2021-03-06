/** @jsx jsx */
import {jsx} from '@emotion/react'
import React, {useMemo} from 'react'
import {Console, Decode} from 'console-feed/src'
import type {Message} from 'console-feed/src/definitions/Component'
import type {Styles} from 'console-feed/src/definitions/Styles'
import {baseInspectorStyles} from './Inspector'
import {useIsDarkMode} from './darkMode'

export * from 'console-feed/src'
export type {Message}

// borrow from https://github.com/microsoft/vscode-icons
const infoSVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M8.56844 1.03128C10.1595 1.19039 11.6437 1.90518 12.7601 3.04996C13.9764 4.28555 14.6955 5.92552 14.7804 7.65726C14.8652 9.38899 14.3098 11.0913 13.2201 12.4398C12.2179 13.6857 10.8114 14.5416 9.24435 14.8594C7.67733 15.1772 6.0485 14.9369 4.6401 14.18C3.22867 13.4066 2.12683 12.1706 1.5201 10.68C0.910659 9.18166 0.82953 7.52043 1.29009 5.96988C1.74966 4.42537 2.72803 3.0868 4.06008 2.17996C5.38108 1.27892 6.97735 0.87217 8.56844 1.03128ZM9.04012 13.8799C10.383 13.6075 11.5888 12.8756 12.4501 11.81C13.3827 10.6509 13.8572 9.18961 13.7835 7.70377C13.7097 6.21792 13.0929 4.81093 12.0501 3.74991C11.0949 2.77492 9.82753 2.16667 8.46938 2.0314C7.11123 1.89614 5.74875 2.24247 4.62008 3.00992C3.77051 3.59531 3.0845 4.38792 2.62697 5.31265C2.16945 6.23738 1.95559 7.26359 2.00567 8.2941C2.05574 9.3246 2.36809 10.3253 2.91311 11.2013C3.45813 12.0773 4.21776 12.7997 5.12008 13.3C6.3184 13.9467 7.70586 14.1519 9.04012 13.8799ZM7.37506 6L8.62506 6L8.62506 5L7.37506 5L7.37506 6ZM8.62506 7L8.62506 11L7.37506 11L7.37506 7L8.62506 7Z" fill="#007ACC"/>
</svg>`
const warnSVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M7.55976 1H8.43976L14.9798 13.26L14.5398 14H1.43976L0.999756 13.26L7.55976 1ZM7.99976 2.28L2.27976 13H13.6998L7.99976 2.28ZM8.62476 12V11H7.37476V12H8.62476ZM7.37476 10V6H8.62476V10H7.37476Z" fill="#FFCC00"/>
</svg>`
const errorIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M8.59975 0.999985C10.1998 1.09999 11.6998 1.89999 12.7998 2.99999C14.0998 4.39999 14.7998 6.09999 14.7998 8.09999C14.7998 9.69999 14.1998 11.2 13.1998 12.5C12.1998 13.7 10.7998 14.6 9.19975 14.9C7.59975 15.2 5.99975 15 4.59975 14.2C3.19975 13.4 2.09975 12.2 1.49975 10.7C0.899753 9.19999 0.799753 7.49999 1.29975 5.99999C1.79975 4.39999 2.69975 3.09999 4.09975 2.19999C5.39975 1.29999 6.99975 0.899985 8.59975 0.999985ZM9.09975 13.9C10.3998 13.6 11.5998 12.9 12.4998 11.8C13.2998 10.7 13.7998 9.39999 13.6998 7.99999C13.6998 6.39999 13.0998 4.79999 11.9998 3.69999C10.9998 2.69999 9.79975 2.09999 8.39975 1.99999C7.09975 1.89999 5.69975 2.19999 4.59975 2.99999C3.49975 3.79999 2.69975 4.89999 2.29975 6.29999C1.89975 7.59999 1.89975 8.99999 2.49975 10.3C3.09975 11.6 3.99975 12.6 5.19975 13.3C6.39975 14 7.79975 14.2 9.09975 13.9ZM7.89974 7.5L10.2997 5L10.9997 5.7L8.59974 8.2L10.9997 10.7L10.2997 11.4L7.89974 8.9L5.49974 11.4L4.79974 10.7L7.19974 8.2L4.79974 5.7L5.49974 5L7.89974 7.5Z" fill="#F48771"/>
</svg>`
const debugIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3.46279 12.86L3.45815 12.79C3.45964 12.8134 3.46119 12.8367 3.46279 12.86Z" fill="#C5C5C5"/>
<path d="M10.7275 13.5509L7.69304 10.501L8.70723 9.4868L11.9159 12.7117L15.0789 9.54875L16.0931 10.5629L13.0589 13.5972L16.0934 16.647L15.0792 17.6612L11.8705 14.4362L8.70748 17.5993L7.69329 16.5851L10.7275 13.5509Z" fill="#C5C5C5"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M16.9329 5.00286V6H18.2784L21.1205 3.15788L22.1347 4.17207L19.4435 6.86321L19.476 6.94805C20.0424 8.42597 20.3614 10.094 20.3614 11.86C20.3614 12.1955 20.3499 12.5274 20.3274 12.8552L20.3222 12.93H23.8629V14.3643H20.142L20.1315 14.4217C19.8292 16.075 19.2409 17.5825 18.4398 18.851L18.3802 18.9454L21.8027 22.3852L20.7859 23.3968L17.512 20.1063L17.4131 20.2169C15.934 21.8712 14.0177 22.8629 11.93 22.8629C9.81001 22.8629 7.86653 21.8402 6.37842 20.1395L6.27988 20.0268L3.07125 23.2355L2.05706 22.2213L5.42258 18.8558L5.36431 18.7615C4.59172 17.5118 4.02373 16.0363 3.72847 14.4217L3.71797 14.3643H0V12.93H3.53777L3.53262 12.8552C3.51009 12.5274 3.49858 12.1955 3.49858 11.86C3.49858 10.117 3.80935 8.46951 4.36194 7.00599L4.39377 6.92168L1.63228 4.14621L2.64904 3.13457L5.50003 6H6.92715V5.00286C6.92715 2.23986 9.16701 0 11.93 0C14.693 0 16.9329 2.23986 16.9329 5.00286ZM8.36144 5.00286V6H15.4986V5.00286C15.4986 3.03199 13.9009 1.43429 11.93 1.43429C9.95914 1.43429 8.36144 3.03199 8.36144 5.00286ZM18.1609 7.52498L18.1267 7.43429H5.73328L5.69915 7.52498C5.21331 8.81605 4.93286 10.2859 4.93286 11.86C4.93286 14.6199 5.7951 17.061 7.11691 18.7793C8.43755 20.4962 10.1529 21.4286 11.93 21.4286C13.7072 21.4286 15.4225 20.4962 16.7431 18.7793C18.0649 17.061 18.9271 14.6199 18.9271 11.86C18.9271 10.2859 18.6467 8.81605 18.1609 7.52498Z" fill="#C5C5C5"/>
</svg>`

const toImageURL = (svg: string) =>
  `url("data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}")`

// https://github.com/samdenty/console-feed/pull/96
// https://github.com/samdenty/console-feed/pull/97
const darkStyles: Styles = {
  ...baseInspectorStyles,
  LOG_ICON_WIDTH: '1em',
  LOG_ICON_HEIGHT: '1em',
  LOG_ICON_BACKGROUND_SIZE: 'contain',
  // replace original PNG icons with vector icons
  LOG_INFO_ICON: toImageURL(infoSVG),
  LOG_WARN_ICON: toImageURL(warnSVG),
  LOG_ERROR_ICON: toImageURL(errorIcon),
  LOG_DEBUG_ICON: toImageURL(debugIcon),
}

const lightStyles = {
  ...darkStyles,
}

type Props = {
  logs: Message[]
  shouldDecode?: boolean
}

const decodeLogs = (logs: Message[]) => {
  return logs.map((log) => ({
    ...log,
    data: log.data.map((x) => Decode([x])),
  }))
}

export const StyledConsole: React.FC<Props> = ({
  logs,
  shouldDecode = false,
  ...props
}) => {
  const isDarkMode = useIsDarkMode()
  const decoded = useMemo(
    () => (shouldDecode ? decodeLogs(logs) : logs),
    [logs, shouldDecode]
  )

  return (
    <div
      css={{
        width: '100%',
        height: '100%',
        background: isDarkMode ? '#252526' : '#f3f3f3',
      }}
      {...props}
    >
      <Console
        logs={decoded}
        styles={isDarkMode ? darkStyles : lightStyles}
        variant={isDarkMode ? 'dark' : 'light'}
      />
    </div>
  )
}
