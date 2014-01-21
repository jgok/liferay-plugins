<%--
/**
 * Copyright (c) 2000-2013 Liferay, Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation; either version 2.1 of the License, or (at your option)
 * any later version.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more
 * details.
 */
--%>

<%@ taglib uri="http://liferay.com/tld/util" prefix="liferay-util" %>

<%@ page import="com.liferay.portal.kernel.util.GetterUtil" %>
<%@ page import="com.liferay.portal.kernel.util.PropsUtil" %>
<%@ page import="com.liferay.portal.kernel.util.StringBundler" %>
<%@ page import="com.liferay.portal.kernel.util.StringPool" %>
<%@ page import="com.liferay.portal.kernel.util.StringUtil" %>

<liferay-util:buffer var="html">
	<liferay-util:include page="/html/js/editor/ckeditor/ckconfig.portal.jsp" />
</liferay-util:buffer>

<%
	int extraPluginsIndex = html.indexOf("CKEDITOR.config.extraPlugins");
	int extraPluginsStartIndex = html.indexOf(StringPool.APOSTROPHE, extraPluginsIndex);
	int extraPluginsEndIndex = html.indexOf(StringPool.SEMICOLON, extraPluginsIndex);

	String extraPlugins = html.substring(extraPluginsStartIndex + 1, extraPluginsEndIndex - 1);

	String[] plugins = StringUtil.split(extraPlugins, StringPool.COMMA);

	StringBundler sb = new StringBundler(plugins.length + 1);

	for (int i = 0; i < plugins.length; i++) {
		String plugin = plugins[i];

		sb.append(plugin);
		sb.append(StringPool.COMMA);

		if (i == 0) {
			sb.append(_SPELLCHECKER_EXTRA_PLUGIN_NAME_VALUE);
			sb.append(StringPool.COMMA);
		}
	}

	sb.setIndex(sb.index() - 1);

	html = StringUtil.replace(html, extraPlugins, sb.toString());
	html = StringUtil.replace(html, "SpellChecker", _SPELLCHECKER_EXTRA_PLUGIN_NAME_VALUE);
%>

<%= html %>

<%!
	private static final String _SPELLCHECKER_EXTRA_PLUGIN_NAME_KEY = "liferay.spellchecker.extra.plugin.name";

	private static final String _SPELLCHECKER_EXTRA_PLUGIN_NAME_VALUE = GetterUtil.getString(PropsUtil.get(_SPELLCHECKER_EXTRA_PLUGIN_NAME_KEY));
%>